# NaaS Pricing Calculator

A comprehensive web-based Network-as-a-Service pricing calculator that replicates and enhances the functionality of the Excel-based NaaS & Support costing spreadsheet.

## 🚀 Features

### ✅ Complete Feature Set

#### Core Functionality
- **Modular Calculation Engine**: Implements all pricing calculations from the original Excel spreadsheet
- **Component-Based Pricing**: Price individual components (PRTG, Capital Equipment, Support, etc.) independently
- **Full Quote Wizard**: Step-by-step guided workflow for comprehensive solutions
- **Real-Time Calculations**: Instant price updates as you modify parameters
- **Excel/CSV Import & Export**: Seamlessly import existing data and export quotes
- **Local Data Persistence**: Auto-save functionality using browser localStorage

#### User Interface
- **Modern Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Progressive Disclosure**: Complex functionality presented in digestible steps
- **Interactive Dashboard**: Quick access to all major functions
- **Live Pricing Sidebar**: Real-time cost breakdown during configuration
- **Component Templates**: Pre-configured packages for common scenarios

#### Data Management
- **Quote History**: Save, load, and manage multiple quotes
- **Template System**: Quick-start templates for different business sizes
- **Backup & Restore**: Export/import complete configurations
- **Version Control**: Track changes and quote iterations

## 🏗 Project Structure

```
naas-calculator/
├── index.html              # Main application entry point
├── src/
│   ├── app.js              # Main application controller (2189 lines)
│   ├── main.js             # Application entry point
│   ├── config.js           # Application configuration
│   ├── core/               # Core calculation system
│   │   ├── calculations.js       # All pricing formulas
│   │   ├── calculation-orchestrator.js  # Dependency-based execution
│   │   └── dependency-graph.js   # Component relationships
│   ├── components/         # UI Components
│   │   ├── components.js   # Individual component forms
│   │   └── wizard.js       # Multi-step quote builder
│   ├── services/           # Data and storage services
│   │   ├── data-store.js   # Centralized state management
│   │   └── storage-manager.js  # localStorage persistence
│   ├── managers/           # Feature managers
│   └── utils/              # Utility functions
│       ├── security.js     # Input sanitization
│       ├── error-handler.js  # Global error handling
│       └── import-export.js  # Excel/CSV import/export
├── css/
│   └── styles.css          # Custom styles and responsive design
├── components/             # TypeScript/React scaffolding (not wired up)
├── lib/                    # Integration stubs (not wired up)
└── docs/                   # Documentation
    ├── PRD.md              # Product requirements
    ├── DEVELOPMENT_ROADMAP.md  # Development strategy
    └── TECHNICAL_DEBT.md   # Known technical debt
```

**Note:** This is a Vite-based application. The actual architecture uses ES modules with `src/` as the primary codebase. See `CLAUDE.md` for detailed architecture documentation.

## 💻 Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility in mind
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **Font Awesome**: Icon library for consistent visual elements
- **Google Fonts**: Inter font family for modern typography

### Libraries & Tools
- **SheetJS (xlsx)**: Excel file reading and writing
- **jsPDF**: PDF generation for proposals
- **Local Storage API**: Client-side data persistence

## 🚀 Getting Started

### For Users
1. Open `index.html` in a modern web browser
2. Start with the **Dashboard** for an overview
3. Use **Component Pricing** for individual component quotes
4. Use **Full Quote Builder** for comprehensive solutions
5. Access **History** to manage saved quotes

### For Developers
1. Clone or download the project files
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open http://localhost:8000 in your browser
5. Modify `src/core/calculations.js` for pricing logic changes
6. Customize Tailwind classes or `css/styles.css` for branding

**Development Commands:**
```bash
npm run dev       # Start dev server (localhost:8000)
npm run build     # Production build
npm run preview   # Preview production build
npm test          # Run unit tests (Vitest)
npm run test:e2e  # Run E2E tests (Cypress)
npm run lint      # Lint and auto-fix
npm run format    # Format code with Prettier
```

### Browser Requirements
- Modern browsers with ES6+ support
- JavaScript enabled
- Local storage available
- File API support for import/export

## 🧮 Pricing Model Components

### PRTG Monitoring
- **License Tiers**: Up to 100, 500, 1000, 2500 sensors, or unlimited
- **Service Levels**: Standard (8x5), Enhanced (24x7), Enterprise (24x7 + Dedicated)
- **Setup Costs**: Based on complexity and service level
- **Monthly Service**: Recurring monitoring and support costs

### Capital Equipment
- **Equipment Types**: Routers, switches, firewalls, wireless equipment
- **Financing Options**: APR-based calculations at 5% annual rate
- **Term Options**: 12, 24, 36, 48, or 60-month financing
- **Down Payment**: Optional down payment to reduce monthly costs

### Support Services
- **Service Tiers**: Basic (8x5), Standard (12x5), Enhanced (24x7)
- **Per-Device Pricing**: Base cost plus per-device monthly fee
- **Escalation**: 3% annual CPI-based cost increases
- **Contract Terms**: 1, 2, 3, or 5-year commitments

### Onboarding & Implementation
- **Complexity Levels**: Simple, Standard, Complex, Enterprise
- **Site-Based Pricing**: Base cost plus per-additional-site fees
- **Assessment Options**: Network, Security, or Comprehensive assessments
- **One-Time Costs**: No recurring fees for implementation

## 📊 Summary of Current Functional Entry URIs

### Main Navigation
- `/` - **Dashboard**: Main overview with component quick access
- `/#components` - **Component Pricing**: Individual component configuration
- `/#wizard` - **Full Quote Builder**: 5-step comprehensive quote workflow
- `/#history` - **Quote History**: Manage saved quotes and configurations

### Component Access Points
- **PRTG Monitoring**: Network monitoring setup and pricing
- **Capital Equipment**: Hardware selection with financing options
- **Support Services**: 24/7 support packages with escalation
- **Onboarding**: Implementation and setup services
- **PBS Foundation**: Platform and administrative services

### API-Like Functions (JavaScript)
- `calculator.calculatePRTG(params)` - PRTG pricing calculations
- `calculator.calculateCapital(params)` - Equipment financing calculations
- `calculator.calculateSupport(params)` - Support service pricing
- `calculator.calculateOnboarding(params)` - Implementation costs
- `calculator.calculateCombinedQuote(components)` - Full solution pricing

## 🔒 Security & Best Practices

### Data Security
- **Client-Side Only**: No sensitive data transmitted to servers
- **Local Storage**: All data remains in user's browser
- **Input Validation**: Comprehensive form validation and sanitization
- **XSS Protection**: Proper input escaping and output encoding

### Performance
- **Lazy Loading**: Components loaded on-demand
- **Efficient Calculations**: Optimized algorithms for real-time updates
- **Memory Management**: Proper cleanup of event listeners and data
- **Responsive Design**: Optimized for all device sizes

### Accessibility
- **ARIA Labels**: Screen reader compatibility
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Supports high contrast mode
- **Semantic HTML**: Proper heading structure and landmarks

## 📈 Analytics & Reporting

### Built-in Metrics
- Quote generation frequency
- Most popular components
- Average quote values
- Conversion tracking (quote to proposal)

### Export Capabilities
- **Excel Workbooks**: Complete quote breakdown with multiple sheets
- **CSV Files**: Data interchange format for external systems
- **PDF Reports**: Professional proposals with company branding
- **JSON Data**: Raw data for system integration

## 🤝 Contributing

### Code Standards
- Use ESLint for code linting
- Follow JSDoc conventions for documentation
- Maintain consistent indentation (2 spaces)
- Use semantic commit messages

### Testing
- Test all calculations against original Excel formulas
- Verify cross-browser compatibility
- Test responsive design on multiple devices
- Validate accessibility with screen readers

## 📞 Support & Maintenance

### Known Issues
- Excel import may require manual data mapping for complex sheets
- PDF export has basic formatting (future enhancement planned)
- Mobile wizard interface could be improved (on roadmap)

### Troubleshooting
- Clear browser cache if calculations seem incorrect
- Check console for JavaScript errors
- Ensure JavaScript is enabled in browser
- Verify file permissions for import/export functionality

## 📄 License

This project is proprietary software. All rights reserved.

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with full Excel spreadsheet functionality
- Component-based pricing system
- Full quote wizard workflow
- Excel/CSV import/export capabilities
- Responsive web design
- Local data persistence

### Planned Releases
- **v1.1.0**: Enhanced UI/UX and mobile optimization
- **v1.2.0**: Backend integration and user authentication
- **v2.0.0**: Enterprise features and CRM integration

---

**Last Updated**: January 2025  
**Project Status**: ✅ Fully Functional - Ready for Production Use
