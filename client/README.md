# Jubil-à-Temps Client

Jubil-à-Temps is a comprehensive time tracking application that helps you manage and visualize your work hours.

![⏱️](https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/23f1.svg)

## Features

- **Time Tracking**: Log your work shifts with start and end times
- **Visual Activity Graph**: View your work history in an activity graph similar to GitHub's contribution chart
- **Daily, Weekly & Monthly Summaries**: Track your totals for different time periods
- **Authentication System**: Secure user registration and login
- **Email Reports**: Automated weekly and monthly digest emails with time summaries
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- [pnpm](https://pnpm.io/) package manager

### Installation

1. Clone the repository
2. Navigate to the client directory
3. Install dependencies:

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at http://localhost:5173

### Building for Production

Build the project for production:

```bash
pnpm build
```

The build output will be in the `dist` directory.

## Project Structure

- `src/components/` - React components
- `src/context/` - React contexts including authentication
- `src/App.tsx` - Main application component

## Backend Integration

This client connects to the Jubil-à-Temps server which provides:
- API for shift management
- Authentication services
- Email reporting features

Make sure the server is running for full functionality.
