module.exports = function(eleventyConfig) {
  // Set the layout directory
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("collection", "layouts/collection.njk");
  
  // Copy images to output directory
  eleventyConfig.addPassthroughCopy("src/images");
  
  // Don't copy CSS files - let Tailwind handle the compilation
  // eleventyConfig.addPassthroughCopy("src/css");
  
  // Watch CSS files for changes
  eleventyConfig.addWatchTarget("src/css/");
  
  return {
    dir: {
      input: "src",
      output: "_site",
      layouts: "_layouts"
    }
  };
};
