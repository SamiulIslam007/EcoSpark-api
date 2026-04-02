/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../utils/prisma";

const getAllUsers = async (query: { page?: string; limit?: string; search?: string }) => {
  const { page = "1", limit = "20", search } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { ideas: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
};

const toggleUserActive = async (id: string, requesterId: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { notFound: true } as const;
  if (user.id === requesterId) return { selfAction: true } as const;

  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, isActive: true },
  });
};

const changeUserRole = async (id: string, role: string, requesterId: string) => {
  if (role !== "MEMBER" && role !== "ADMIN") return { invalid: true } as const;
  if (id === requesterId) return { selfAction: true } as const;

  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, role: true },
  });
};

const getDashboardStats = async () => {
  const [totalUsers, totalIdeas, pendingIdeas, approvedIdeas] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.idea.count({ where: { status: "APPROVED" } }),
  ]);

  return { totalUsers, totalIdeas, pendingIdeas, approvedIdeas };
};

const adminDeleteIdea = async (id: string) => {
  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return { notFound: true } as const;
  await prisma.idea.delete({ where: { id } });
  return { deleted: true } as const;
};

const subscribeNewsletter = async (email: string) => {
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {},
    create: { email },
  });
  return { subscribed: true } as const;
};

export const AdminService = {
  getAllUsers,
  toggleUserActive,
  changeUserRole,
  getDashboardStats,
  adminDeleteIdea,
  subscribeNewsletter,
};
