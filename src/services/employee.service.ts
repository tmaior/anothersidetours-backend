import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/migrations/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, email: string, password: string) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newEmployee = await this.prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    delete newEmployee.password;
    return newEmployee;
  }

  async validateLogin(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (isPasswordValid) {
      return {
        message: 'Login successful',
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
        },
      };
    } else {
      throw new NotFoundException('Invalid credentials');
    }
  }

}
