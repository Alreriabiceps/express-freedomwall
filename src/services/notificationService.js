import { broadcastNotification } from "../server.js";

// Notification service for real-time updates
export class NotificationService {
  // Send notification for new post
  static async notifyNewPost(postData) {
    const notification = {
      type: "newPost",
      title: "New Post on Freedom Wall",
      body: `${postData.name || "Anonymous"} just shared something new!`,
      data: {
        postId: postData._id,
        postType: "post",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("New post notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending new post notification:", error);
    }
  }

  // Send notification for new comment
  static async notifyNewComment(postData, commentData) {
    const notification = {
      type: "newComment",
      title: "New Comment on Post",
      body: `${commentData.name || "Anonymous"} commented on a post`,
      data: {
        postId: postData._id,
        commentId: commentData._id,
        postType: "comment",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("New comment notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending new comment notification:", error);
    }
  }

  // Send notification for new poll
  static async notifyNewPoll(pollData) {
    const notification = {
      type: "newPoll",
      title: "New Poll Available",
      body: `A new poll has been created: ${pollData.question}`,
      data: {
        pollId: pollData._id,
        postType: "poll",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("New poll notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending new poll notification:", error);
    }
  }

  // Send notification for poll results
  static async notifyPollResults(pollData) {
    const notification = {
      type: "pollResults",
      title: "Poll Results Updated",
      body: `Poll results have been updated: ${pollData.question}`,
      data: {
        pollId: pollData._id,
        postType: "poll",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("Poll results notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending poll results notification:", error);
    }
  }

  // Send notification for new announcement
  static async notifyNewAnnouncement(announcementData) {
    const notification = {
      type: "newAnnouncement",
      title: "New Announcement",
      body: announcementData.title,
      data: {
        announcementId: announcementData._id,
        postType: "announcement",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("New announcement notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending new announcement notification:", error);
    }
  }

  // Send notification for post like
  static async notifyPostLike(postData, likeCount) {
    const notification = {
      type: "postLike",
      title: "Post Liked",
      body: `Your post got a like! Total likes: ${likeCount}`,
      data: {
        postId: postData._id,
        postType: "like",
        likeCount: likeCount,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("Post like notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending post like notification:", error);
    }
  }

  // Send notification for post report
  static async notifyPostReport(postData, reportCount) {
    const notification = {
      type: "postReport",
      title: "Post Reported",
      body: `A post has been reported and needs attention`,
      data: {
        postId: postData._id,
        postType: "report",
        reportCount: reportCount,
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("Post report notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending post report notification:", error);
    }
  }

  // Send system notification
  static async sendSystemNotification(title, body, data = {}) {
    const notification = {
      type: "system",
      title: title,
      body: body,
      data: {
        ...data,
        postType: "system",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("System notification sent:", notification.title);
    } catch (error) {
      console.error("Error sending system notification:", error);
    }
  }

  // Send test notification
  static async sendTestNotification(userId) {
    const notification = {
      type: "test",
      title: "Test Notification",
      body: "This is a test notification from Freedom Wall! 🎉",
      data: {
        userId: userId,
        postType: "test",
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };

    try {
      broadcastNotification(notification);
      console.log("Test notification sent for user:", userId);
    } catch (error) {
      console.error("Error sending test notification:", error);
    }
  }
}
