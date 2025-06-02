import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddEmployeeModal } from "@/components/modals/add-employee-modal";
import { 
  Users, 
  Plus, 
  Search, 
  User,
  Shield,
  UserCheck,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Employee {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
  createdAt: string;
  profileImageUrl?: string;
}

export default function Employees() {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: user?.role === "admin",
  });

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getPermissionBadges = (permissions: string[]) => {
    const permissionLabels: Record<string, string> = {
      sales: "Sales",
      stock_in: "Stock In",
      stock_out: "Stock Out",
      view_reports: "Reports",
    };

    return permissions.map(permission => permissionLabels[permission] || permission);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = employees.filter(emp => emp.role === "admin").length;
  const employeeCount = employees.filter(emp => emp.role === "employee").length;

  // Only show this page to admins
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <main className="flex-1 ml-64 pt-16 p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600">Only administrators can access employee management.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">Manage employee accounts and permissions</p>
        </div>
        <Button onClick={() => setShowAddEmployee(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-2xl font-bold text-gray-900">{employeeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Members</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? "No employees found matching your search" : "No employees found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
                    const permissions = getPermissionBadges(employee.permissions || []);
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {employee.profileImageUrl ? (
                                <img 
                                  src={employee.profileImageUrl} 
                                  alt={fullName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {fullName || "No name provided"}
                              </p>
                              <p className="text-sm text-gray-500">ID: {employee.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900">{employee.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={employee.role === "admin" ? "default" : "secondary"}
                            className={employee.role === "admin" ? "bg-purple-100 text-purple-800" : ""}
                          >
                            {employee.role === "admin" ? "Administrator" : "Employee"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {permissions.length > 0 ? (
                              permissions.map((permission, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">All permissions</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDateTime(employee.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        open={showAddEmployee} 
        onOpenChange={setShowAddEmployee} 
      />
    </div>
  );
}
