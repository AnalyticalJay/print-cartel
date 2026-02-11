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
