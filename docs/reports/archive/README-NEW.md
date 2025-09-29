# NaaS Pricing Calculator

A professional, secure Network-as-a-Service pricing calculator built with modern web technologies. This application replicates Excel spreadsheet functionality for pricing PRTG monitoring, capital equipment, support services, and comprehensive NaaS solutions.

## 🚀 Features

### Core Functionality
- **Component-based Pricing**: Individual calculation modules for each service type
- **Full Quote Builder**: Comprehensive wizard for complete NaaS solutions
- **Real-time Calculations**: Instant pricing updates as you configure
- **Volume Discounts**: Automatic discounts for multiple components
- **Import/Export**: Excel, CSV, and PDF export capabilities
- **Data Persistence**: Auto-save to browser storage

### Security & Quality
- **Input Validation**: Comprehensive validation and sanitization
- **XSS Protection**: Safe DOM manipulation with DOMPurify
- **Error Handling**: Comprehensive error tracking and user feedback
- **Type Safety**: JSDoc types and runtime validation
- **Content Security Policy**: Secure headers and resource loading

### Development Experience
- **Modern Tooling**: Vite, ESLint, Prettier, Vitest
- **Testing**: Unit tests and end-to-end testing with Cypress
- **PWA Ready**: Service worker and offline capabilities
- **Responsive Design**: Mobile-first responsive layout

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Tailwind CSS, Custom CSS Variables
- **Build Tool**: Vite
- **Testing**: Vitest (unit), Cypress (e2e)
- **Code Quality**: ESLint, Prettier, Husky
- **Libraries**: DOMPurify, jsPDF, SheetJS (XLSX)

## 📦 Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm 8.0.0 or higher

### Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd naas-pricing-calculator

# Run setup script (recommended)
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run e2e tests
npm run test:e2e

# Run all tests
npm run test:run
```

## 🏗️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:e2e` | Run Cypress tests |
| `npm run lint` | Lint and fix code |
| `npm run format` | Format code with Prettier |

### Project Structure

```
src/
├── components/          # UI components
│   ├── component-manager.js
│   └── wizard.js
├── services/           # Business logic
│   ├── calculations.js
│   ├── data-store.js
│   └── import-export.js
├── utils/              # Utilities
│   ├── security.js
│   └── error-handler.js
└── app.js             # Main application

tests/
├── utils/             # Utility tests
├── services/          # Service tests
└── setup.js           # Test configuration

cypress/
├── e2e/              # End-to-end tests
└── support/          # Test utilities
```

### Code Quality

This project enforces strict code quality standards:

- **ESLint**: JavaScript linting with security rules
- **Prettier**: Consistent code formatting
- **Husky**: Git hooks for pre-commit checks
- **Vitest**: Fast unit testing
- **Cypress**: Reliable e2e testing

## 🔒 Security

### Features
- Input validation and sanitization
- XSS protection with DOMPurify
- Content Security Policy headers
- Secure data storage practices
- Error handling and logging

### Best Practices
- All user inputs are validated and sanitized
- HTML content is processed through DOMPurify
- External resources loaded with integrity checks
- Sensitive operations have comprehensive error handling

## 🎯 Usage

### Individual Components

1. Navigate to the **Components** tab
2. Select a component from the sidebar (e.g., PRTG, Capital Equipment)
3. Configure the component parameters
4. View real-time pricing calculations
5. Export individual component quotes

### Full Quote Builder

1. Click **Full Quote Builder** from the dashboard
2. Follow the step-by-step wizard
3. Configure project details and all components
4. Review comprehensive pricing with volume discounts
5. Export complete solution quotes

### Import/Export

- **Import**: Excel/CSV files with existing configurations
- **Export**: PDF reports, Excel workbooks, or CSV data
- **Formats**: Support for multiple export formats and templates

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

**Test Failures**
```bash
# Run tests with verbose output
npm run test:run -- --reporter=verbose

# Run specific test file
npm run test -- path/to/test.js
```

**Development Server Issues**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Performance

- Initial load: <2 seconds
- Calculation updates: <100ms
- Memory usage: <50MB typical

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run quality checks: `npm run lint && npm run test:run`
5. Submit a pull request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation
- Ensure security best practices

## 📄 License

Private/Proprietary - Qolcom Ltd

## 🔄 Version History

### v2.0.0 (Current)
- ✅ Modern development infrastructure
- ✅ Comprehensive security improvements
- ✅ Full testing suite
- ✅ Performance optimizations
- ✅ PWA capabilities

### v1.0.0 (Legacy)
- Basic calculator functionality
- Excel-like interface
- Component-based architecture
- Local storage persistence

## 📞 Support

For technical support or questions:

- Create an issue in the repository
- Contact the development team
- Check the troubleshooting guide above

## 🚀 Deployment

### Production Build

```bash
# Build optimized version
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to your hosting provider
```

### Environment Configuration

Create `.env` files for different environments:

```env
# .env.production
VITE_API_URL=https://api.yourcompany.com
VITE_APP_VERSION=2.0.0
```

### Hosting Recommendations

- **Netlify**: Automatic deployments from Git
- **Vercel**: Zero-config deployments
- **AWS S3**: Static site hosting
- **GitHub Pages**: Simple hosting solution

---

Built with ❤️ by the Qolcom Development Team