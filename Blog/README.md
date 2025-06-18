# Blog Posts

This folder contains markdown files for blog posts that will be displayed on the portfolio website.

## How to Add a New Blog Post

1. Create a new `.md` file in this folder with a descriptive filename (e.g., `my-new-post.md`)

2. Add frontmatter at the top of your markdown file:
   ```markdown
   ---
   title: Your Post Title
   date: YYYY-MM-DD
   excerpt: A brief description of your post that will appear on the blog listing page
   tags: tag1, tag2, tag3
   ---
   ```

3. Write your blog post content in markdown below the frontmatter

4. Update the `blogPosts` array in `index.html` to include your new filename:
   ```javascript
   const blogPosts = [
       'welcome-to-my-blog.md',
       'your-new-post.md'  // Add this line
   ];
   ```

## Frontmatter Fields

- `title`: The title of your blog post (required)
- `date`: Publication date in YYYY-MM-DD format (required)
- `excerpt`: A short description that appears in the blog listing (optional)
- `tags`: Comma-separated list of tags (optional)

## Example Post Structure

```markdown
---
title: My Amazing Blog Post
date: 2025-06-18
excerpt: This post talks about amazing things in AI and software development
tags: ai, software, tutorial
---

# My Amazing Blog Post

Your blog content goes here...

## Section 1

Content for section 1...

## Section 2

Content for section 2...
```

## Notes

- Posts are automatically sorted by date (newest first)
- Clicking on a blog post card will open the markdown file in a new tab
- Tags will be displayed as badges on each post card
- If no excerpt is provided, the first 200 characters of the content will be used
