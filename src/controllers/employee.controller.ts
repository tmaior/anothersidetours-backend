import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('employee')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Post('register')
  async register(@Body() body) {
    const { name, email, password } = body;
    try {
      const newEmployee = await this.employeeService.create(
        name,
        email,
        password,
      );
      return { message: 'Employee registered successfully', newEmployee };
    } catch {
      throw new BadRequestException('Failed to register employee');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get(':employeeId')
  async getEmployee(@Param('employeeId') employeeId: string){
    return this.employeeService.getEmployee(employeeId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('')
  async update(@Body() body: { id: string; name: string; email: string }) {
    const { id, name, email } = body;
    console.log('ID:', id, 'Name:', name, 'Email:', email);
    return this.employeeService.update(id, name, email);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  async updatePassword(@Body() body) {
    const { id, currentPassword ,password } = body;
    return this.employeeService.updatePassword(id, currentPassword,password);
  }
}
