# Nick Dove - Photographer Website

A modern, responsive author website built with [Eleventy](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/).

## Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Fast Performance**: Static site generation with Eleventy
- **Modern Typography**: Beautiful typography with Tailwind Typography plugin
- **Clean Navigation**: Simple, intuitive navigation between pages
- **Professional Layout**: Clean, author-focused design

## Pages

- **About** (`/`) - Home page with author information and bio
- **Writing** (`/writing/`) - Portfolio of published works and projects
- **CV** (`/cv/`) - Professional background and achievements

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd mcrumps
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server with live reload:

```bash
npm run dev
```

This will:
- Start the Eleventy development server
- Watch for file changes
- Automatically rebuild the site
- Serve the site at `http://localhost:8080`

### Building for Production

To build the site for production:

```bash
npm run build
```

This creates a `_site` directory with the built website.

### CSS Development

To watch and build CSS changes:

```bash
npm run css:build
```

To build CSS for production (minified):

```bash
npm run css:build-prod
```

## Project Structure

```
mcrumps/
├── src/
│   ├── _includes/          # Reusable template components
│   ├── _layouts/           # Page layouts
│   ├── css/               # CSS files (including Tailwind)
│   ├── js/                # JavaScript files
│   ├── images/            # Image assets
│   ├── index.njk          # About page (home)
│   ├── writing/           # Writing page
│   └── cv/                # CV page
├── _site/                 # Built site (generated)
├── .eleventy.js           # Eleventy configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies and scripts
```

## Customization

### Content

- Edit the content in the `.njk` files in the `src/` directory
- Update author information, publications, and personal details
- Modify the navigation links in `src/_layouts/base.njk`

### Styling

- Modify `src/css/style.css` for custom CSS
- Update `tailwind.config.js` for theme customization
- The site uses the Inter font family by default

### Configuration

- Update `.eleventy.js` for build configuration
- Modify `tailwind.config.js` for design system changes
- Update `postcss.config.js` for CSS processing options

## Deployment

The built site in the `_site` directory can be deployed to any static hosting service:

- **Netlify**: Drag and drop the `_site` folder
- **Vercel**: Connect your repository
- **GitHub Pages**: Push the `_site` contents to a gh-pages branch
- **AWS S3**: Upload the `_site` contents to an S3 bucket

## Technologies Used

- **Eleventy (11ty)**: Static site generator
- **Tailwind CSS**: Utility-first CSS framework
- **Nunjucks**: Template engine
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please refer to the documentation for [Eleventy](https://www.11ty.dev/docs/) and [Tailwind CSS](https://tailwindcss.com/docs). 