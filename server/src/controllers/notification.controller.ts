import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getNotifications = async (_req: Request, res: Response): Promise<any> => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        isRead: false,
      },
    });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notifications";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};

export const markAsRead = async (_req: Request, res: Response): Promise<any> => {
  try {
    await prisma.notification.updateMany({
      where: {
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark notifications as read error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to mark notifications as read";
    return res.status(400).json({
      error: errorMessage,
      message: errorMessage,
    });
  }
};
