# Custom Keychain 3MF Generator

A modern web application for generating custom 3D keychains with text and exporting them as 3MF files for 3D printing.

**Created by Alberto Nicas (April 2025) - V2.3 Enhanced Web Version**

## Features

- **Real-time 3D Preview**: Interactive 3D viewer with mouse controls for rotation, zoom, and pan
- **Customizable Text**: Support for two lines of text with adjustable size, height, and spacing
- **Expandable Font System**: Built-in fonts plus ability to add custom Google Fonts
- **Ring Options**: Optional keychain ring with adjustable size and position
- **Color Support**: Single or dual-color designs
- **3MF Export**: Export your design as a 3MF file ready for 3D printing
- **Intuitive UI**: Modern, responsive interface built with Tailwind CSS
- **Real-time Updates**: Live preview updates as you adjust parameters

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Three.js & React Three Fiber** - 3D rendering and visualization
- **React Three Drei** - Additional Three.js helpers
- **Tailwind CSS** - Modern styling
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd "Eunoia Made"
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Basic Operation

1. **Enter Text**: Add your desired text in the "First Line" field. Optionally add a second line.
2. **Choose Font**: Select from built-in fonts or add custom Google Fonts
3. **Adjust Parameters**: Use the sliders to modify text size, border thickness, ring settings, etc.
4. **Preview**: View your keychain in real-time in the 3D viewer
5. **Export**: Click "Export 3MF" to download your design for 3D printing

### Parameter Guide

#### Text Settings
- **First Line**: Main text (required)
- **Second Line**: Optional secondary text
- **Font**: Choose from available fonts or add custom ones
- **Text Height**: How much the text protrudes (positive) or is carved (negative)
- **Text Size**: Overall size of the text
- **Line Spacing**: Space between two lines of text

#### Border Settings
- **Border Thickness**: How thick the border around the text is
- **Border Height**: Height of the base/border

#### Ring Settings
- **Show Ring**: Toggle the keychain ring on/off
- **Outer/Inner Diameter**: Size of the ring
- **Ring Height**: Thickness of the ring
- **X/Y Position**: Adjust ring placement

#### Color Settings
- **Two Colors**: Enable separate colors for base and text
- **Base Color**: Color of the border and ring
- **Text Color**: Color of the text (when two colors enabled)

### Adding Custom Fonts

1. Click the "+" button next to the font selector
2. Enter the font name (exactly as it appears in CSS)
3. Optionally provide a Google Fonts URL
4. The font will be loaded and added to your available fonts

**Google Fonts URL Example:**
```
https://fonts.googleapis.com/css2?family=Roboto:wght@700&display=swap
```

## File Structure

```
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── KeychainGenerator.tsx # Main component
│   ├── ParameterControls.tsx # UI controls
│   ├── KeychainViewer.tsx   # 3D viewer
│   └── FontModal.tsx        # Font addition modal
├── types/
│   └── keychain.ts          # TypeScript definitions
├── utils/
│   ├── geometryGenerator.ts # 3D geometry creation
│   └── 3mfExporter.ts       # 3MF file export
└── package.json
```

## 3D Printing Notes

- The exported 3MF files are in millimeters
- Recommended minimum text height: 0.8mm for raised text, 0.5mm for carved text
- Ring inner diameter should be at least 3mm for practical use
- Consider your printer's minimum feature size when setting parameters

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebGL support is required for 3D rendering.

## License

This project is open source. Feel free to modify and distribute.

## Credits

- Original OpenSCAD design by Alberto Nicas
- Web implementation enhanced for modern browsers
- Built with love for the 3D printing community

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool.
