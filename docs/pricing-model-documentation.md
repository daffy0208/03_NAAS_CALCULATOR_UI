# NaaS Pricing Calculator - Pricing Model Documentation

## Overview

This document provides explicit documentation of the pricing model relationships, calculation methodologies, and data flow within the NaaS Pricing Calculator. It resolves ambiguities in the annual vs. three-year cost calculations and documents the complete dependency chain.

## Core Pricing Data Structure

### Standard Result Format
All component calculations return this standardized structure:

```javascript
{
    totals: {
        oneTime: Number,    // One-time setup/implementation costs
        monthly: Number,    // Base monthly recurring cost (no discounts)
        annual: Number,     // 12-month cost with annual payment discount
        threeYear: Number   // 36-month total with term and escalation
    },
    breakdown: {
        // Component-specific cost breakdown
    },
    discounts: {
        // Applied discount information
    },
    params: {
        // Configuration parameters used
    }
}
```

## Pricing Calculation Hierarchy

### Level 1: Base Component Calculations
Individual components calculate costs independently using their specific parameters:

- **PRTG Monitoring**: Sensor-based licensing + service fees
- **Capital Equipment**: Hardware costs + financing calculations
- **Support Services**: Tiered support + per-device charges
- **Onboarding**: Complexity-based implementation costs
- **PBS Foundation**: User-based platform costs

### Level 2: Dependency-Based Calculations
Components that depend on Level 1 results:

- **Support Services**: Device count from Capital Equipment affects pricing
- **Enhanced Services**: Build upon base support tiers

### Level 3: Global Discount Application
Volume and term discounts applied across all active components:

- **Volume Discounts**: Based on total monthly spend
- **Bundle Discounts**: Based on number of active components
- **Term Discounts**: Based on contract duration

## Detailed Cost Relationship Definitions

### Annual vs. Three-Year Cost Relationship

#### Annual Cost Calculation:
```javascript
annual = (monthly * 12) * (1 - annualPaymentDiscount)
```
- **Base**: Monthly cost × 12 months
- **Discount**: 2% discount for annual payment
- **Represents**: Single year cost if paid annually upfront

#### Three-Year Cost Calculation:
```javascript
threeYear = yearOne + yearTwo + yearThree

Where:
yearOne = annual // No escalation in first year
yearTwo = annual * (1 + escalationRate)
yearThree = annual * (1 + escalationRate)²
```

- **CPI Escalation**: 3% annual escalation applied to years 2 and 3
- **Term Discount**: Additional 3% discount on total three-year amount
- **Represents**: Total cost commitment for 36-month contract

#### Key Distinctions:
1. **Annual** = Cost for one year with annual payment discount
2. **Three-Year** = Total cumulative cost over 36 months with escalation
3. **Relationship**: `threeYear ≠ annual × 3` due to escalation and term discounts

### Volume Discount Tiers

#### Monthly Total Thresholds:
```javascript
if (monthlyTotal >= £5,000)     discount = 10.0%
else if (monthlyTotal >= £3,000) discount = 7.5%
else if (monthlyTotal >= £1,500) discount = 5.0%
else                            discount = 0.0%
```

#### Bundle Discounts (Additional):
```javascript
if (componentCount >= 4)        additionalDiscount = 5.0%
else if (componentCount >= 3)   additionalDiscount = 2.5%
else                           additionalDiscount = 0.0%
```

#### Final Discount Calculation:
```javascript
monthlyDiscount = Math.min(volumeDiscount + bundleDiscount, 20%)
annualDiscount = Math.min(monthlyDiscount + 2%, 25%)
termDiscount = Math.min(annualDiscount + 3%, 30%)
```

## Component-Specific Pricing Models

### PRTG Monitoring
**Base Licensing (One-time)**:
- 100 sensors: £500
- 500 sensors: £1,500
- 1,000 sensors: £2,800
- 2,500 sensors: £5,600
- 5,000+ sensors: £8,900

**Monthly Service Fees**:
```javascript
Enhanced Service = baseLicense * 0.0625  // 6.25% of license cost
Standard Service = Enhanced * 0.8        // 80% of enhanced rate
```

**Location Multiplier**: Additional 15% per location beyond the first

### Capital Equipment Financing
**Financing Formula**:
```javascript
monthlyPayment = (equipmentCost * monthlyRate) / (1 - (1 + monthlyRate)^(-termMonths))

Where:
monthlyRate = annualRate / 12
annualRate = 4.5% (current APR)
```

**Equipment Categories**:
- **Routers**: £500 - £8,000 per unit
- **Switches**: £300 - £5,000 per unit
- **Firewalls**: £1,200 - £12,000 per unit
- **Wireless APs**: £200 - £800 per unit

### Support Services
**Base Monthly Costs**:
```javascript
Basic Support    = £400 + (deviceCount * £20)
Standard Support = £600 + (deviceCount * £28)
Enhanced Support = £960 + (deviceCount * £40)
```

**Device Count Sources**:
1. **User Input**: Direct entry in support configuration
2. **Capital Equipment**: Automatic count from equipment list
3. **Default**: 10 devices if no other source available

## Dependency Resolution Order

### Calculation Sequence (Topological Order):
```
Level 0 (Independent):
  - help, assessment, admin, otherCosts

Level 1 (Base Services):
  - prtg, capital, onboarding, pbsFoundation

Level 2 (Dependent Services):
  - support (depends on capital device count)

Level 3 (Enhanced Services):
  - enhancedSupport (depends on support)
  - naasStandard (depends on prtg, support)
  - naasEnhanced (depends on naasStandard)

Level 4 (Contract Pricing):
  - dynamics1Year, dynamics3Year, dynamics5Year (depend on all components)

Level 5 (Global Processing):
  - Volume discount calculation
  - Final total computation
```

## Error Handling and Edge Cases

### Invalid Input Handling:
1. **Missing Parameters**: Apply component defaults
2. **Out-of-Range Values**: Clamp to min/max bounds
3. **Invalid Types**: Convert or reject with error message

### Circular Dependency Prevention:
1. **Detection**: Validate calculation order before execution
2. **Resolution**: Use explicit dependency levels
3. **Fallback**: Use cached results or defaults

### Precision and Rounding:
1. **Intermediate Calculations**: Maintain full precision
2. **Final Display**: Round to nearest penny (2 decimal places)
3. **Currency Formatting**: Use Intl.NumberFormat for localization

## Contract Term Variations

### 1-Year Contracts:
- **Monthly Discount**: Volume + bundle discounts only
- **No CPI Escalation**: Fixed pricing for 12 months
- **Term Discount**: None

### 3-Year Contracts (Recommended):
- **Monthly Discount**: Volume + bundle discounts
- **Annual Discount**: +2% for annual payment option
- **Term Discount**: +3% for 36-month commitment
- **CPI Escalation**: 3% annually on base costs

### 5-Year Contracts:
- **All 3-Year Benefits**: Plus extended term advantages
- **Extended Term Discount**: +5% total (2% additional)
- **Escalation Cap**: CPI increases capped at 5% annually

## Data Validation Rules

### Component Parameter Ranges:
```javascript
// PRTG Monitoring
sensors: 1 - 50,000
locations: 1 - 1,000
serviceLevel: ['standard', 'enhanced', 'enterprise']

// Capital Equipment
equipmentQuantity: 1 - 1,000 per item
customCost: £0 - £1,000,000 per item
financingTerm: 12 - 84 months

// Support Services
deviceCount: 1 - 10,000
supportLevel: ['basic', 'standard', 'enhanced', 'enterprise']
contractTerm: 12 - 60 months
```

### Import Data Validation:
1. **File Size**: Maximum 10MB
2. **Row Limits**: 10,000 rows per sheet
3. **Data Types**: Strict type checking with conversion
4. **Business Logic**: Cross-field validation rules

## Testing and Quality Assurance

### Critical Test Cases:
1. **Boundary Values**: Min/max parameter values
2. **Discount Stacking**: Multiple discount combinations
3. **Escalation Accuracy**: Multi-year cost calculations
4. **Dependency Chains**: Complex component interactions

### Expected Calculation Results (Sample):
```javascript
// Test Case: Mid-size deployment
{
  prtg: { sensors: 500, serviceLevel: 'enhanced' },
  capital: { equipment: [{ type: 'router_medium', quantity: 2 }] },
  support: { level: 'enhanced', deviceCount: 15 }
}

Expected Results:
monthly: ~£2,100
annual: ~£24,700 (with annual discount)
threeYear: ~£78,400 (with escalation and term discount)
```

## Future Enhancement Considerations

### Scalability Improvements:
1. **Caching**: Pre-calculate common configurations
2. **Parallel Processing**: Calculate independent components simultaneously
3. **Database Integration**: Move from localStorage to proper database

### Model Enhancements:
1. **Regional Pricing**: Support multiple currencies and regions
2. **Custom Escalation**: Allow client-specific escalation rates
3. **Seasonal Discounts**: Time-based promotional pricing

This documentation serves as the definitive reference for understanding all pricing relationships and calculations within the NaaS Pricing Calculator system.