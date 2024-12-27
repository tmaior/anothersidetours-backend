import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';

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

  @Post('login')
  async login(@Body() body) {
    const { email, password } = body;
    return this.employeeService.validateLogin(email, password);
  }
}
