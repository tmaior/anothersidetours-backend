import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { Permissions } from '../decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_CREATE')
  async createRole(@Body() body: { name: string; description?: string }) {
    return this.roleService.createRole(body.name, body.description);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_READ')
  async getAllRoles() {
    return this.roleService.getAllRoles();
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_READ')
  async getRoleById(@Param('id') id: string) {
    return this.roleService.getRoleById(id);
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_UPDATE')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.roleService.updateRole(id, body);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_DELETE')
  async deleteRole(@Param('id') id: string) {
    return this.roleService.deleteRole(id);
  }

  @Post('permissions')
  @UseGuards(PermissionGuard)
  @Permissions('PERMISSION_CREATE')
  async createPermission(@Body() body: { code: string; description?: string }) {
    return this.roleService.createPermission(body.code, body.description);
  }

  @Get('permissions')
  @UseGuards(PermissionGuard)
  @Permissions('PERMISSION_READ')
  async getAllPermissions() {
    return this.roleService.getAllPermissions();
  }

  @Get('permissions/:id')
  @UseGuards(PermissionGuard)
  @Permissions('PERMISSION_READ')
  async getPermissionById(@Param('id') id: string) {
    return this.roleService.getPermissionById(id);
  }

  @Post(':roleId/permissions/:permissionId')
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_UPDATE')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.roleService.assignPermissionToRole(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  @UseGuards(PermissionGuard)
  @Permissions('ROLE_UPDATE')
  async removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.roleService.removePermissionFromRole(roleId, permissionId);
  }

  @Post('employees/:employeeId/roles/:roleId')
  @UseGuards(PermissionGuard)
  @Permissions('EMPLOYEE_UPDATE')
  async assignRoleToEmployee(
    @Param('employeeId') employeeId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.roleService.assignRoleToEmployee(employeeId, roleId);
  }

  @Delete('employees/:employeeId/roles/:roleId')
  @UseGuards(PermissionGuard)
  @Permissions('EMPLOYEE_UPDATE')
  async removeRoleFromEmployee(
    @Param('employeeId') employeeId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.roleService.removeRoleFromEmployee(employeeId, roleId);
  }

  @Get('employees/:employeeId/roles')
  @UseGuards(PermissionGuard)
  @Permissions('EMPLOYEE_READ')
  async getEmployeeRoles(@Param('employeeId') employeeId: string) {
    return this.roleService.getEmployeeRoles(employeeId);
  }

  @Get('employees/:employeeId/permissions')
  @UseGuards(PermissionGuard)
  @Permissions('EMPLOYEE_READ')
  async getEmployeePermissions(@Param('employeeId') employeeId: string) {
    return this.roleService.getEmployeePermissions(employeeId);
  }
} 