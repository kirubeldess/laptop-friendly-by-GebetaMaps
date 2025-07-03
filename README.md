# Laptop Friendly Places Finder

A web application that helps users find the perfect laptop friendly spots in addis ababa based on their preferences and requirements. Built with Next.js and MongoDB.

## Features

- **Advanced Search**: Filter spots by amenities, location, noise level, and more
- **Detailed Comparisons**: Compare multiple locations side by side
- **User Authentication**: Create accounts to save favorite spots and preferences
- **Responsive Design**: Optimized for both desktop and mobile devices

## tech stacks

- **Frontend**: Next.js 15, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes, MongoDB
- **Authentication**: NextAuth
- **File Uploads**: UploadThing

you can see the deployed version at: https://laptop-friendly-by-gebeta-maps.vercel.app

## 🛠️ Installation
1. First things first, get your GebetaMaps API KEY. 
    you can get it from: https://gebeta.app/
2. Clone the repo
   ```bash
   git clone https://github.com/kirubeldess/laptop-friendly-by-GebetaMaps
   ```

3. Install dependencies
   ```
   npm install
   ```

4. Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=
   NEXTAUTH_SECRET=
   UPLOADTHING_TOKEN=
   NEXT_PUBLIC_GEBETA_API_KEY=
   ```

5. Run the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build

To build the application for production:

```
npm run build

```

## Contributing

Submit a pull request
