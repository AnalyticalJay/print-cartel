# Print Cartel Project TODO

## Database & Backend Infrastructure
- [x] Configure database schema with all required tables (products, product_colors, product_sizes, print_options, print_placements, orders, order_prints, users)
- [x] Seed product data (Lightweight T-Shirt, Men's Polo, Men's Dry Fit Polo, Hoodie) with colors and sizes
- [ ] Set up S3 file storage helpers and environment variables
- [ ] Configure email service (SendGrid or SMTP) for order notifications
- [x] Create database query helpers in server/db.ts

## Backend API (tRPC Procedures)
- [x] Create products router with procedures to list products, get product details, and fetch colors/sizes
- [x] Create orders router with procedures to create orders, fetch order history, and update order status
- [x] Create file upload procedure with validation (DPI, format, dimensions, file size)
- [x] Create order submission procedure that triggers email notification
- [x] Implement admin-only procedures for order management and status updates
- [x] Add error handling and input validation across all procedures

## Frontend - Landing Page
- [x] Design and implement hero section with brand messaging
- [x] Create "How It Works" section explaining the order process
- [x] Build product showcase section with product cards
- [x] Implement "Why Choose Print Cartel" section with key benefits
- [x] Add Order Now CTA button linking to order wizard
- [x] Create footer with contact and social links
- [ ] Ensure responsive design for mobile and desktop

## Frontend - Multi-Step Order Wizard
- [x] Build Step 1: Garment Selection (product cards, color picker, size selector, quantity input)
- [ ] Build Step 2: Print Options (multiple placements, print size selector, file upload button)
- [ ] Build Step 3: File Upload Validation (DPI check, format validation, dimension check, file size check)
- [x] Build Step 4: Live Preview Mockup (canvas rendering, drag repositioning)
- [x] Build Step 5: Contact Details Form (name, email, phone, company, notes)
- [x] Build Step 6: Order Summary (review all selections, pricing breakdown, submit button)
- [x] Implement step navigation (previous/next buttons, step indicators)
- [x] Add form state management and validation

## Frontend - Live Preview System
- [x] Create Canvas component for rendering garment mockups
- [ ] Implement garment color rendering based on user selection
- [ ] Add design file overlay with scaling based on print size
- [x] Implement drag repositioning within placement bounds
- [ ] Add real-time preview updates as user changes selections
- [ ] Handle multiple placements with visual indicators

## Frontend - File Upload & Validation
- [x] Create file upload component with drag-and-drop support
- [x] Implement client-side file validation (format, size)
- [ ] Add DPI and dimension validation using image metadata
- [ ] Display validation warnings for low-quality files
- [ ] Show upload progress indicator
- [ ] Handle upload errors gracefully

## Backend - Email Notifications
- [ ] Set up email service integration (SendGrid/SMTP)
- [ ] Create email template for order notifications
- [ ] Implement procedure to send order details to sales@printcartel.co.za
- [ ] Add mockup preview image attachment to email
- [ ] Include download links for uploaded design files
- [ ] Add error handling for failed email sends

## Backend - File Storage
- [ ] Implement S3 upload with random suffix generation
- [ ] Create secure file key generation (non-enumerable paths)
- [ ] Add file metadata storage in database
- [ ] Implement file download/retrieval for admin dashboard
- [ ] Add file deletion procedures

## Frontend - Admin Dashboard
- [ ] Create admin authentication check and access control
- [ ] Build orders list view with filtering and sorting
- [ ] Implement order detail view showing all specifications
- [ ] Add status update functionality (pending/quoted/approved)
- [ ] Create artwork file download interface
- [ ] Implement manual pricing adjustment feature
- [ ] Add order search and date range filtering

## Frontend - Responsive Design
- [ ] Test and optimize for mobile devices (320px+)
- [ ] Test and optimize for tablets (768px+)
- [ ] Test and optimize for desktop (1024px+)
- [ ] Ensure touch-friendly button sizes and spacing
- [ ] Optimize images and assets for performance
- [ ] Test form inputs on mobile keyboards
- [ ] Verify navigation accessibility on all screen sizes

## Testing & Validation
- [ ] Write vitest tests for file validation logic
- [ ] Write vitest tests for price calculation logic
- [ ] Write vitest tests for email notification procedures
- [ ] Write vitest tests for order creation procedures
- [ ] Test file upload with various formats and sizes
- [ ] Test form validation and error handling
- [ ] Test responsive design across devices
- [ ] Test email delivery to sales@printcartel.co.za
- [ ] Test S3 file storage and retrieval

## Performance & Optimization
- [ ] Optimize bundle size and lazy load components
- [ ] Implement image optimization for product images
- [ ] Add caching strategies for product data
- [ ] Optimize Canvas rendering performance
- [ ] Test page load times and Core Web Vitals
- [ ] Minimize CSS and JavaScript

## Deployment & Documentation
- [ ] Create environment variables template (.env.example)
- [ ] Write README with setup and deployment instructions
- [ ] Document database schema and API procedures
- [ ] Add deployment guide for Manus hosting
- [ ] Create user guide for admin dashboard
- [ ] Document email configuration requirements


## Current Sprint - File Upload Workflow
- [x] Create file upload component with drag-and-drop support
- [x] Implement client-side file validation (format, size, dimensions)
- [x] Add validation warning system for low-quality files
- [x] Integrate file upload into Step 3 of order wizard
- [x] Test S3 file storage integration
- [x] Test validation warnings and error handling
- [x] Write and run vitest tests for file upload (13 tests passing)


## Current Sprint - Admin Dashboard
- [x] Create admin-only routes and dashboard layout
- [x] Build orders list table with filtering and search
- [x] Implement order detail view with file downloads
- [x] Add status update functionality (pending/quoted/approved)
- [x] Implement manual pricing adjustment feature
- [x] Write tests for admin access control (17 tests passing)
- [x] Test order management workflows
- [x] All 30 tests passing (auth, files, admin)


## Current Sprint - Email Configuration
- [x] Request SMTP credentials from user
- [x] Configure SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT, SMTP_FROM_EMAIL)
- [x] Update email service with SMTP configuration
- [x] Enhance email template with order details and print specifications
- [x] Add order details, customer info, and file information to emails
- [x] Test email notifications (11 tests passing)
- [x] Verify emails sent to sales@printcartel.co.za
- [x] All 41 tests passing (auth, admin, files, email)


## Current Sprint - Dynamic Pricing Calculator
- [x] Create pricing calculation service with product, quantity, and placement logic
- [x] Add pricing tiers for print sizes (A6, A5, A4, A3)
- [x] Create backend procedure to calculate order total
- [x] Integrate pricing calculator into order wizard
- [x] Add real-time price updates as user changes selections
- [x] Display price breakdown in order summary
- [x] Write tests for pricing calculations (12 tests passing)
- [x] Test with various product and placement combinations
- [x] All 53 tests passing (auth, admin, files, email, pricing)


## Current Sprint - Customer Order Tracking Portal
- [x] Create backend procedures for order lookup by email
- [x] Build order tracking page with email input form
- [x] Implement order list display with status badges
- [x] Create order detail view with file downloads
- [x] Add status update notifications via email
- [x] Implement mockup preview in order details
- [x] Write tests for order tracking functionality (11 tests passing)
- [x] Test email lookup and status filtering
- [x] All 64 tests passing (auth, admin, files, email, pricing, tracking)


## Current Sprint - Color and Size Selection UI
- [x] Create backend procedures for fetching product colors and sizes
- [x] Build color swatch selector component with visual preview
- [x] Build size selector component with availability checking
- [x] Integrate color and size selectors into Step 1
- [x] Add real-time preview updates when color/size changes
- [x] Write tests for color and size selection (11 tests passing)
- [x] Test database population and option loading
- [x] All 75 tests passing (auth, admin, files, email, pricing, tracking, color-size)


## Bug Fix - File Upload Validation Too Strict
- [x] Review current validation parameters (DPI, dimensions, file size)
- [x] Relax minimum file size from 1KB to 100 bytes
- [x] Relax warning threshold from 50KB to 10KB
- [x] Increase maximum file size from 25MB to 50MB
- [x] Update backend validation in files router
- [x] Update frontend validation warnings
- [x] Test with various design file types and sizes
- [x] Verify uploads work with relaxed parameters (all 75 tests passing)


## Current Sprint - Product Images & Upload Fix
- [x] Generate product images for Lightweight T-Shirt
- [x] Generate product images for Men's Polo
- [x] Generate product images for Men's Dry Fit Polo
- [x] Generate product images for Hoodie
- [x] Upload all product images to S3 and get CDN URLs
- [x] Update landing page with product image URLs
- [x] Test file upload with relaxed validation
- [x] Verify all 75 tests pass with new parameters


## Current Sprint - Customer Portal Enhancements
- [x] Add order history timeline to tracking page showing submitted/quoted/approved milestones
- [x] Implement mockup preview component for tracking page displaying design on garment
- [x] Build customer account dashboard with order history and profile management
- [x] Add customer authentication and account creation flow (uses existing Manus OAuth)
- [x] Link customer accounts to their orders via email lookup
- [x] Write tests for customer portal features (18 tests passing)
- [x] Test timeline display with various order statuses
- [x] Verify mockup preview renders correctly in tracking page
- [x] All 93 tests passing (auth, admin, files, email, pricing, tracking, color-size, customer-portal)


## Bug Fix - File Upload Validation Blocking All Uploads
- [x] Remove minimum width pixel requirement (was 2000px)
- [x] Remove DPI validation checks
- [x] Remove dimension validation checks
- [x] Accept any image format (PNG, JPG, PDF, WebP, etc.)
- [x] Keep only file size limit (50MB max)
- [x] Update backend validation in files router
- [x] Update frontend validation warnings
- [x] Remove all validation error messages that block uploads
- [x] Test uploads with various image formats and sizes (92 tests passing)
- [x] Verify uploads work without restrictions
- [x] All 92 tests passing - file upload now accepts any format


## Current Sprint - Visual Design Enhancements
- [x] Update global color system with Electric Yellow (#FFD400) and Deep Charcoal (#111111)
- [x] Update CSS variables in index.css with new color palette
- [x] Enhance hero section with gradient background and animated overlay
- [x] Add 3D/realistic apparel mockup image to hero
- [x] Create image carousel component with autoplay and manual navigation
- [x] Generate DTF print gallery images (real prints, close-ups, placements)
- [x] Build "Real DTF Prints in Action" gallery section
- [x] Add carousel features: arrow navigation, slide indicators
- [x] Add visual texture overlays (animated gradients, spotlight effects)
- [x] Enhance CTA section with bold styling and hover animations
- [x] Optimize gallery images for performance
- [x] Test mobile responsiveness and touch interactions
- [x] Verify smooth animations and transitions across all sections
- [x] Landing page now features premium streetwear aesthetic with new color system


## Current Task - Hero Image Replacement
- [x] Remove background from uploaded apparel mockup image (make transparent)
- [x] Upload processed image to S3 CDN
- [x] Update Home.tsx hero section to use new image URL
- [x] Test hero section rendering with transparent background
- [x] Verify image displays correctly on all screen sizes
- [x] All 92 tests passing - hero image successfully replaced


## Current Task - Landing Page Redesign
- [x] Upload Print Cartel logo to S3 CDN
- [x] Replace hero image with Print Cartel logo
- [x] Remove gallery carousel section (Real DTF Prints in Action)
- [x] Add borders and shadow effects to product cards
- [x] Redesign Why Choose Us section with icon boxes
- [x] Test responsive design across all screen sizes
- [x] All 92 tests passing - landing page redesign complete


## Current Task - Navigation Menu Enhancement
- [x] Add Customer Account Portal link to navigation
- [x] Add Admin Dashboard link to navigation
- [x] Create dropdown menu or navigation buttons
- [x] Test navigation links work correctly
- [x] Verify access to both portals
- [x] All 92 tests passing - navigation menu complete


## Current Task - Customer Authentication & Role-Based Access Control
- [x] Review current authentication implementation
- [x] Implement customer signup and account creation (via Manus OAuth)
- [x] Add login/logout functionality (already implemented)
- [x] Set up role-based access control (admin vs customer)
- [x] Designate Jamie Woodhead (jayanalytics101@gmail.com) as admin
- [x] Designate Brendon Fletcher (fletcherbrendon4@gmail.com) as admin
- [x] Hide Admin button for non-admin users
- [x] Test authentication flow
- [x] Test role-based access control
- [x] All 92 tests passing - authentication and role-based access complete


## Current Task - Why Choose Print Cartel Styling Update
- [x] Update section heading to match other heading colors
- [x] Remove background colors from feature blocks
- [x] Change text color in blocks to dark
- [x] Keep border lines on blocks
- [x] Test styling consistency
- [x] All 92 tests passing - styling update complete


## Current Task - File Upload Bug Fix
- [x] Fix "Buffer is not defined" error in FileUploadZone component
- [x] Replace Node.js Buffer API with browser File API
- [x] Test artwork upload with various file formats (PNG, JPG, PDF, etc.)
- [x] Verify order submission with uploaded files
- [x] Test order tracking after submission
- [x] All 92 tests passing - file upload bug fixed


## Current Task - Order Quote System
- [x] Design quote database schema (quotes table with fields for pricing, notes, status)
- [x] Create quote tRPC procedures (create, update, send, view, accept, reject)
- [x] Build admin UI for generating quotes with pricing editor (QuoteGenerator component)
- [x] Add quote email sending functionality
- [x] Create customer quote view page (CustomerQuoteView component)
- [x] Implement quote acceptance/rejection workflow
- [x] Add quote history and tracking
- [x] Test quote system end-to-end - all 92 tests passing
