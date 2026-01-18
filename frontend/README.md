# InterviewPro Frontend

A modern, responsive React frontend for the Student/Startup Interviews Web App built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Features

### Core Functionality

- **User Authentication**: Sign up, login, and social authentication (Google, LinkedIn, Microsoft)
- **Role Selection**: Browse and select job roles for interview practice
- **CV Upload**: Drag-and-drop CV upload with role mapping
- **Credit System**: Purchase credits and manage wallet balance
- **Dashboard**: Comprehensive overview of user activities and progress

### UI/UX Features

- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Mobile-first design that works on all devices
- **Dark/Light Mode**: Built-in theme support (ready for implementation)
- **Interactive Components**: Smooth animations and hover effects
- **Accessibility**: WCAG compliant components with proper ARIA labels

## 🛠️ Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications
- **React Dropzone** - File upload with drag-and-drop

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Dialog.tsx
│   │   └── ...
│   ├── layout/             # Layout components
│   │   ├── Layout.tsx
│   │   └── Navbar.tsx
│   ├── AuthForm.tsx        # Authentication forms
│   └── SocialLoginButtons.tsx
├── pages/                  # Page components
│   ├── Home.tsx           # Landing page
│   ├── Auth.tsx           # Authentication page
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Roles.tsx          # Role selection
│   ├── Upload.tsx         # CV upload
│   └── Wallet.tsx         # Wallet & payments
├── hooks/                  # Custom React hooks
│   └── useAuth.ts
├── lib/                    # Utility functions
│   ├── api.ts             # API client
│   └── utils.ts           # Helper functions
├── types/                  # TypeScript type definitions
│   └── index.ts
└── App.tsx                # Main app component
```

## 🎨 Design System

### Color Palette

- **Primary**: Blue (#3B82F6) to Indigo (#6366F1) gradient
- **Secondary**: Slate grays for text and backgrounds
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)
- **Warning**: Yellow (#F59E0B)

### Typography

- **Headings**: Inter font family, bold weights
- **Body**: System font stack for optimal performance
- **Code**: JetBrains Mono for technical content

### Spacing

- Consistent 4px base unit (Tailwind's default)
- Responsive spacing with mobile-first approach

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:

   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📱 Pages Overview

### 🏠 Home Page (`/`)

- Hero section with compelling value proposition
- Feature showcase with icons and descriptions
- Statistics and social proof
- Testimonials from users
- Call-to-action sections
- Footer with links and company info

### 🔐 Authentication (`/login`, `/register`)

- Unified auth page with tabs for login/register
- Form validation with real-time feedback
- Social login buttons (Google, LinkedIn, Microsoft)
- Password visibility toggle
- Responsive design for all screen sizes

### 📊 Dashboard (`/dashboard`)

- Welcome section with user greeting
- Statistics cards (credits, roles, CVs, profile completion)
- Quick action buttons for common tasks
- Recent activity timeline
- Profile summary with edit options
- Tabbed interface for different views

### 🎯 Roles Selection (`/roles`)

- Grid layout of available job roles
- Search and filter functionality
- Role cards with descriptions and tags
- Selection state management
- Bulk selection capabilities
- Category-based filtering

### 📄 CV Upload (`/upload`)

- Drag-and-drop file upload area
- File type and size validation
- Upload progress indicators
- Role mapping selection
- File management (view, delete)
- Upload guidelines and tips

### 💳 Wallet (`/wallet`)

- Current balance display
- Credit pack selection with pricing
- Payment method information
- Transaction history
- Direct credit purchase
- Order tracking and status

## 🔧 API Integration

The frontend integrates with the FastAPI backend through a comprehensive API client:

### Authentication

- `authAPI.register()` - User registration
- `authAPI.login()` - User login
- `authAPI.refresh()` - Token refresh
- `authAPI.logout()` - User logout
- Social login redirects

### Profile Management

- `profileAPI.getProfile()` - Get user profile
- `profileAPI.updateProfile()` - Update profile

### Roles

- `rolesAPI.getRoles()` - Get available roles
- `rolesAPI.getUserRoles()` - Get user's selected roles
- `rolesAPI.addRoleSelection()` - Add role selections

### CV Management

- `cvsAPI.presignUpload()` - Get presigned upload URL
- `cvsAPI.confirmUpload()` - Confirm file upload
- `cvsAPI.getUserCVs()` - Get user's CVs
- `cvsAPI.deleteCV()` - Delete CV
- `cvsAPI.getDownloadUrl()` - Get download URL

### Wallet & Payments

- `walletAPI.getWallet()` - Get wallet balance
- `walletAPI.getTransactions()` - Get transaction history
- `walletAPI.createPaymentOrder()` - Create payment order

## 🎨 Component Library

### UI Components

- **Button**: Multiple variants (primary, secondary, outline, ghost)
- **Card**: Container with header, content, and footer
- **Input**: Form input with validation states
- **Dialog**: Modal dialogs with overlay
- **Badge**: Status indicators and labels
- **Progress**: Loading and progress indicators
- **Alert**: Notification and error messages
- **Avatar**: User profile pictures
- **Select**: Dropdown selection
- **Tabs**: Tabbed interface
- **Toast**: Notification toasts

### Layout Components

- **Header**: Sticky navigation with logo and user menu
- **Sidebar**: Navigation sidebar (if needed)
- **Footer**: Page footer with links

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations

- Touch-friendly button sizes (44px minimum)
- Swipe gestures for navigation
- Optimized form layouts
- Collapsible navigation
- Mobile-specific interactions

## 🔒 Security Features

- **JWT Token Management**: Secure token storage and refresh
- **Input Validation**: Client-side validation with Zod schemas
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation
- **Secure File Upload**: Presigned URLs for direct upload

## 🧪 Testing

### Test Setup (Ready for implementation)

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Test Structure

- Unit tests for components
- Integration tests for API calls
- E2E tests for user flows

## 🚀 Deployment

### Build Optimization

- Code splitting with React.lazy()
- Tree shaking for unused code
- Image optimization
- CSS purging with Tailwind

### Environment Variables

```env
VITE_API_URL=https://api.interviewpro.com
VITE_APP_NAME=InterviewPro
VITE_APP_VERSION=1.0.0
```

### Deployment Platforms

- **Vercel**: Recommended for React apps
- **Netlify**: Alternative with good CI/CD
- **AWS S3 + CloudFront**: For enterprise deployments

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Implement changes with proper TypeScript types
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

### Code Standards

- Use TypeScript for all new code
- Follow React best practices
- Use Tailwind classes consistently
- Write meaningful commit messages
- Add JSDoc comments for complex functions

## 📚 Additional Resources

### Documentation

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)

### Design Inspiration

- Modern SaaS applications
- Clean, professional interfaces
- Accessibility-first design
- Mobile-first approach

## 🐛 Known Issues

- Social login callbacks need proper error handling
- File upload progress could be more granular
- Offline support not implemented
- PWA features not enabled

## 🔮 Future Enhancements

- **PWA Support**: Offline functionality and app-like experience
- **Dark Mode**: Complete dark theme implementation
- **Internationalization**: Multi-language support
- **Advanced Analytics**: User behavior tracking
- **Real-time Updates**: WebSocket integration
- **Advanced File Management**: Bulk operations and organization
- **Mobile App**: React Native version

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Frontend Development**: Modern React/TypeScript implementation
- **UI/UX Design**: Clean, professional interface
- **Backend Integration**: Seamless API communication

---

For more information, please contact the development team or refer to the backend documentation.
