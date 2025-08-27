import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "./src/models/Post.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateEngagementScores = async () => {
  try {
    console.log("Starting engagement score update...");

    // Get all posts
    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts to update`);

    let updatedCount = 0;

    for (const post of posts) {
      // Calculate engagement score
      const likes = post.likes || 0;
      const comments = post.comments ? post.comments.length : 0;
      const engagementScore = likes + comments * 2;

      // Update the post
      await Post.findByIdAndUpdate(post._id, {
        engagementScore: engagementScore,
      });

      updatedCount++;
      console.log(
        `Updated post ${post._id}: ${engagementScore} points (${likes} likes + ${comments} comments × 2)`
      );
    }

    console.log(
      `Successfully updated ${updatedCount} posts with engagement scores`
    );
  } catch (error) {
    console.error("Error updating engagement scores:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the update
updateEngagementScores();
