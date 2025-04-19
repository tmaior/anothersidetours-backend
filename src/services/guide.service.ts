import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/migrations/prisma.service';
import { MailService } from './mail.service';
import { EmailReminderService } from './email-reminder.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GuideService {
  private readonly logger = new Logger(GuideService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private emailReminderService: EmailReminderService,
  ) {}

  async getAllGuides() {
    const guides = await this.prisma.employee.findMany({
      where: {
        employeeRoles: {
          some: {
            role: {
              name: 'GUIDE',
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        status: true,
        imageUrl: true,
        isActive: true,
      }
    });

    this.logger.log(`Found ${guides.length} guides`);

    return guides.map(g => ({
      id: g.id,
      name: g.name,
      email: g.email,
      phone: g.phone ?? '',
      imageUrl: g.imageUrl ?? '',
      bio: g.bio ?? '',
      status: g.status ?? 'Active',
      isActive: g.isActive,
      available: g.isActive,
    }));
  }

  async getGuideById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        employeeRoles: {
          include: {
            role: true
          }
        },
        reservationGuides: {
          include: {
            reservation: true
          }
        }
      }
    });

    if (!employee || !employee.employeeRoles.some(er => er.role.name === 'GUIDE')) {
      return null;
    }

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      imageUrl: employee.imageUrl || '',
      bio: employee.bio || '',
      status: employee.status || 'Active',
      available: employee.isActive,
      reservation: employee.reservationGuides.map(rg => rg.reservation)
    };
  }

  async getGuidesByTenantId(tenantId: string) {
    return this.prisma.employee.findMany({
      where:{
        tenantId,
      }
    });
  }

  async createGuide(data: {
    name: string;
    email: string;
    phone: string;
    imageUrl: string;
    bio: string;
    status: string;
    available: boolean;
    tenantId: string;
  }) {
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email: data.email }
    });

    if (existingEmployee) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash('Guia1234', 10);
    const guideRole = await this.prisma.role.findFirst({
      where: { name: 'GUIDE' }
    });

    if (!guideRole) {
      throw new Error('Guide role not found');
    }
    const employee = await this.prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        bio: data.bio,
        imageUrl: data.imageUrl,
        status: data.status || 'Active',
        isActive: data.available ?? true,
        employeeRoles: {
          create: {
            roleId: guideRole.id
          }
        }
      }
    });

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      imageUrl: employee.imageUrl || '',
      bio: employee.bio || '',
      status: employee.status || 'Active',
      available: employee.isActive
    };
  }

  async updateGuide(
    id: string,
    data: { name?: string; email?: string; phone?: string; bio?: string; imageUrl?: string; available?: boolean }
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        employeeRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!employee || !employee.employeeRoles.some(er => er.role.name === 'GUIDE')) {
      throw new Error('Guide not found');
    }

    const updatedEmployee = await this.prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        imageUrl: data.imageUrl,
        isActive: data.available
      }
    });

    return {
      id: updatedEmployee.id,
      name: updatedEmployee.name,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone || '',
      imageUrl: updatedEmployee.imageUrl || '',
      bio: updatedEmployee.bio || '',
      status: updatedEmployee.status || 'Active',
      available: updatedEmployee.isActive
    };
  }

  async deleteGuide(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        employeeRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!employee || !employee.employeeRoles.some(er => er.role.name === 'GUIDE')) {
      throw new Error('Guide not found');
    }

    const guideRole = employee.employeeRoles.find(er => er.role.name === 'GUIDE');
    
    if (guideRole) {
      await this.prisma.employeeRole.delete({
        where: {
          employeeId_roleId: {
            employeeId: id,
            roleId: guideRole.role.id
          }
        }
      });
    }

    if (employee.employeeRoles.length <= 1) {
      return this.prisma.employee.delete({ 
        where: { id } 
      });
    }

    return { 
      id,
      success: true,
      message: 'Guide role removed from employee'
    };
  }

  async assignGuidesToReservation(guideIds: string[], reservationId: string) {
    const reservationExists = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        notes: true,
        tour: true,
        user: true,
        reservationAddons: {
          include: {
            addon: true,
          },
        },
      },
    });

    if (!reservationExists) {
      throw new Error(`Reservation with ID ${reservationId} not found`);
    }

    await this.prisma.reservationGuide.deleteMany({
      where: { reservationId },
    });

    await this.emailReminderService.deleteRemindersByReservation(reservationId);

    if (guideIds.length === 0) {
      this.logger.log(`No guides to assign, all guides removed from reservation ${reservationId}`);
      return { message: 'All guides removed from reservation', success: true };
    }

    const data = guideIds.map((guideId) => ({
      guideId,
      reservationId,
    }));

    for (const guideId of guideIds) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: guideId },
        include: {
          employeeRoles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!employee) {
        this.logger.warn(`Employee with ID ${guideId} not found`);
        continue;
      }

      if (!employee.employeeRoles.some(er => er.role.name === 'GUIDE')) {
        this.logger.warn(`Employee ${employee.name} is not a guide`);
        continue;
      }

      function convertReservationDate(dateStr: string): {
        date: string;
        time: string;
      } {
        const dateObj = new Date(dateStr);

        dateObj.setHours(dateObj.getHours() - 17);

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        const formattedTime = `${hours}:${minutes} ${ampm}`;

        return { date: formattedDate, time: formattedTime };
      }

      const { date, time } = convertReservationDate(
        reservationExists.reservation_date.toISOString(),
      );

      if (employee.email) {
        const totalPrice = reservationExists.total_price;
        const formattedTotalPrice = totalPrice.toFixed(2);

        const emailData = {
          title: 'Reservation Assigned',
          description: 'Reservation Assigned',
          date: date,
          time: time,
          duration: reservationExists.tour.duration,
          name: reservationExists.user.name,
          email: reservationExists.user.email,
          phone: reservationExists.user.phone,
          tourTitle: reservationExists.tour.name,
          reservationImageUrl: reservationExists.tour.imageUrl,
          quantity: reservationExists.guestQuantity,
          totals: [
            { label: 'Paid', amount: formattedTotalPrice },
            { label: 'Total', amount: formattedTotalPrice },
          ],
        };
        await this.mailService.sendGuideReservationEmail(
          employee.email,
          emailData,
        );
        await this.emailReminderService.createRemindersForReservation(
          reservationId,
        );
      }
    }

    try {
      const result = await this.prisma.reservationGuide.createMany({
        data,
        skipDuplicates: true,
      });
      
      this.logger.log(`Successfully assigned ${result.count} guides to reservation ${reservationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error assigning guides to reservation: ${error.message}`);
      throw error;
    }
  }

  async getGuidesByReservation(reservationId: string) {
    const guides = await this.prisma.reservationGuide.findMany({
      where: { reservationId },
      include: {
        guide: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return guides.map(rg => ({
      guideId: rg.guideId,
      guide: {
        name: rg.guide.name
      }
    }));
  }

  async removeGuideFromTour(tourId: string, guideIds: string[] = []) {
    const tourExists = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tourExists) {
      throw new Error(`Tour with ID ${tourId} not found`);
    }

    if (guideIds.length === 0) {
      return this.prisma.reservationGuide.deleteMany({
        where: {
          reservationId: tourId,
        },
      });
    }

    return this.prisma.reservationGuide.deleteMany({
      where: {
        reservationId: tourId,
        guideId: { in: guideIds },
      },
    });
  }
}
