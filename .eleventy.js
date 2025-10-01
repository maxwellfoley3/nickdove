const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Set the layout directory
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("collection", "layouts/collection.njk");
  
  // Filters
  eleventyConfig.addNunjucksFilter("formatDate", function(dateInput, format = "MMMM yyyy") {
    if (!dateInput) return "";
    // Accept JS Date, ISO string, or custom dd-mm-yyyy from data
    let dt;
    if (dateInput instanceof Date) {
      dt = DateTime.fromJSDate(dateInput);
    } else if (typeof dateInput === "string") {
      // Try ISO first
      dt = DateTime.fromISO(dateInput, { zone: "utc" });
      if (!dt.isValid) {
        // Fallback to dd-MM-yyyy as used in src/_data/writing.js
        const parts = dateInput.split("-");
        if (parts.length === 3) {
          const [dd, mm, yyyy] = parts;
          dt = DateTime.fromFormat(`${dd}-${mm}-${yyyy}`, "dd-MM-yyyy", { zone: "utc" });
        }
      }
    }
    return dt && dt.isValid ? dt.toFormat(format) : String(dateInput);
  });

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
