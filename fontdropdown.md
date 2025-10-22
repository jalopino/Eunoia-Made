# Font Dropdown Component Import Guide

This README provides a comprehensive guide for manually importing the font dropdown functionality from the admin branch to your main branch.

## 📋 Components and Files Required

### Core Components
1. **`components/ParameterControls.tsx`** - Main component containing the font dropdown implementation
2. **`components/RoundedParameterControls.tsx`** - Rounded variant with font selection functionality

### Type Definitions
3. **`types/keychain.ts`** - Contains `FontOption` interface and `defaultFonts` array

### API Routes
4. **`app/api/fonts/route.ts`** - API endpoint for font detection and listing

### Font Files (in `public/fonts/`)
5. **Font Typeface Files** - All `.typeface.json` files in the `public/fonts/` directory

## 🔧 Key Dependencies

### React Hooks and State
```typescript
import { useEffect, useState, useRef } from 'react'
```

### Type Definitions
```typescript
import { KeychainParameters, FontOption, defaultFonts, colorOptions } from '@/types/keychain'
```

### UI Icons
```typescript
import { ChevronDown } from 'lucide-react'
```

### Context (if using toast notifications)
```typescript
import { useToast } from '@/contexts/ToastContext'
```

## 🎯 Font Dropdown Implementation Details

### State Management
```typescript
const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false)
const [fonts] = useState<FontOption[]>(defaultFonts)
```

### Key Functions
1. **`getGoogleFontName(fontName: string)`** - Converts font names for CSS font-family
2. **`handleFontSelect(e: React.ChangeEvent<HTMLSelectElement>)`** - Handles font selection
3. **Click outside handler** - Closes dropdown when clicking outside

### HTML Structure
```jsx
<div className="relative font-dropdown-container">
  <button onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}>
    <span style={{ fontFamily: `"${getGoogleFontName(parameters.font)}", sans-serif` }}>
      {parameters.font}
    </span>
    <ChevronDown className="h-4 w-4 text-gray-400" />
  </button>
  
  {isFontDropdownOpen && (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
      {fonts.filter((f) => f.fileUrl?.toLowerCase().endsWith('.typeface.json')).map((font) => (
        <button onClick={() => { handleFontSelect({ target: { value: font.value } } as any); setIsFontDropdownOpen(false) }}>
          <span style={{ fontFamily: `"${getGoogleFontName(font.name)}", sans-serif` }}>
            {font.name}
          </span>
        </button>
      ))}
    </div>
  )}
</div>
```

## 📁 File Structure to Copy

```
your-project/
├── components/
│   ├── ParameterControls.tsx          # Main component with font dropdown
│   └── RoundedParameterControls.tsx   # Rounded variant
├── types/
│   └── keychain.ts                    # FontOption interface and defaultFonts
├── app/api/
│   └── fonts/
│       └── route.ts                   # Font API endpoint
└── public/fonts/                      # All .typeface.json files
    ├── Rethink.typeface.json
    ├── ChangaOne.typeface.json
    ├── Pacifico.typeface.json
    ├── Bungee.typeface.json
    ├── Poppins.typeface.json
    ├── DynaPuff.typeface.json
    ├── Bangers.typeface.json
    ├── Audiowide.typeface.json
    ├── Archivo.typeface.json
    ├── Borel.typeface.json
    ├── Caprasimo.typeface.json
    ├── CherryBomb.typeface.json
    └── PureBlossom.typeface.json
```

## 🔄 Integration Steps

### Step 1: Copy Type Definitions
1. Copy the `FontOption` interface from `types/keychain.ts`
2. Copy the `defaultFonts` array
3. Ensure `KeychainParameters` interface includes `font` and `fontUrl` properties

### Step 2: Copy API Route
1. Copy `app/api/fonts/route.ts` to your project
2. Ensure the route handles font file detection in `public/fonts/`

### Step 3: Copy Font Files
1. Copy all `.typeface.json` files from `public/fonts/` to your project
2. Ensure file paths match the `defaultFonts` configuration

### Step 4: Copy Component Code
1. Copy the font dropdown implementation from `ParameterControls.tsx`
2. Copy the `getGoogleFontName` function
3. Copy the `handleFontSelect` function
4. Copy the click-outside handler useEffect

### Step 5: Install Dependencies
```bash
npm install lucide-react
```

## 🎨 Styling Requirements

The font dropdown uses Tailwind CSS classes:
- `font-dropdown-container` - Container class for click-outside detection
- `relative`, `absolute`, `z-10` - Positioning
- `bg-white`, `border`, `rounded-md`, `shadow-lg` - Visual styling
- `hover:bg-gray-100`, `focus:bg-gray-100` - Interactive states

## 🔍 Key Features

1. **Font Preview** - Shows font name in its actual font family
2. **Click Outside to Close** - Dropdown closes when clicking outside
3. **Typeface.json Filtering** - Only shows fonts with valid typeface.json files
4. **Dynamic Font Loading** - Supports both local and Google Fonts
5. **Responsive Design** - Works on mobile and desktop

## ⚠️ Important Notes

1. **Font Loading**: The component expects fonts to be available as `.typeface.json` files
2. **API Dependency**: The font dropdown relies on the `/api/fonts` endpoint
3. **State Management**: Uses local state for dropdown open/close
4. **Event Handling**: Properly handles click events and keyboard navigation
5. **CSS Classes**: Ensure Tailwind CSS is properly configured

## 🧪 Testing Checklist

- [ ] Font dropdown opens and closes correctly
- [ ] Font preview displays correctly for each font
- [ ] Click outside closes the dropdown
- [ ] Font selection updates the parameters
- [ ] All fonts from `defaultFonts` are displayed
- [ ] API endpoint `/api/fonts` returns correct data
- [ ] Font files are accessible in `public/fonts/`

## 🔧 Troubleshooting

### Common Issues:
1. **Fonts not displaying**: Check if `.typeface.json` files exist in `public/fonts/`
2. **API errors**: Verify the `/api/fonts` route is working
3. **Styling issues**: Ensure Tailwind CSS is properly configured
4. **Click outside not working**: Check if `.font-dropdown-container` class is applied

### Debug Steps:
1. Check browser console for errors
2. Verify font files are accessible via direct URL
3. Test API endpoint with `fetch('/api/fonts')`
4. Inspect component state with React DevTools

---

**Note**: This implementation is specifically designed for the Eunoia-Made keychain generator project. Adjust paths and configurations as needed for your specific project structure.
