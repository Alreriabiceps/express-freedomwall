// Middleware to filter banned words from content
export const filterBannedWords = (text, bannedWords) => {
  if (!text || !bannedWords || bannedWords.length === 0) {
    return text;
  }

  let filteredText = text;

  // Create a case-insensitive regex pattern for each banned word
  bannedWords.forEach((bannedWord) => {
    if (bannedWord.word && bannedWord.isActive !== false) {
      // Escape special regex characters
      const escapedWord = bannedWord.word.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      // Create case-insensitive regex
      const regex = new RegExp(escapedWord, "gi");
      // Replace banned words with asterisks
      filteredText = filteredText.replace(
        regex,
        "*".repeat(bannedWord.word.length)
      );
    }
  });

  return filteredText;
};

// Middleware function to apply content filtering
export const applyContentFilter = async (req, res, next) => {
  try {
    // Fetch banned words from the database or cache
    // For now, we'll use a simple approach - you can enhance this later
    const bannedWords = [
      // This should be fetched from your banned words collection
      // For now, hardcoded for demonstration
    ];

    // Filter post message if it exists
    if (req.body.message) {
      req.body.originalMessage = req.body.message;
      req.body.message = filterBannedWords(req.body.message, bannedWords);
      req.body.wasCensored = req.body.originalMessage !== req.body.message;
    }

    // Filter comment message if it exists
    if (req.body.message && req.params.id) {
      req.body.originalMessage = req.body.message;
      req.body.message = filterBannedWords(req.body.message, bannedWords);
      req.body.wasCensored = req.body.originalMessage !== req.body.message;
    }

    next();
  } catch (error) {
    console.error("Error applying content filter:", error);
    next(); // Continue without filtering if there's an error
  }
};

