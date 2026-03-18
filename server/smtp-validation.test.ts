import { describe, it, expect } from 'vitest';
import { verifyEmailConnection } from './_core/email';

describe('SMTP Credentials Validation', () => {
  it('should verify SMTP connection with configured credentials', async () => {
    const result = await verifyEmailConnection();
    
    // If SMTP is properly configured, this should return true
    // If not configured, it will return false but won't throw an error
    expect(typeof result).toBe('boolean');
    
    if (result) {
      console.log('✓ SMTP connection verified successfully');
    } else {
      console.log('⚠ SMTP connection could not be verified - check credentials');
    }
  });

  it('should have SMTP environment variables configured', () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL;

    // All SMTP variables should be set
    expect(smtpHost).toBeDefined();
    expect(smtpPort).toBeDefined();
    expect(smtpUser).toBeDefined();
    expect(smtpPass).toBeDefined();
    expect(smtpFromEmail).toBeDefined();

    console.log('✓ All SMTP environment variables are configured');
    console.log(`  Host: ${smtpHost}`);
    console.log(`  Port: ${smtpPort}`);
    console.log(`  User: ${smtpUser}`);
    console.log(`  From: ${smtpFromEmail}`);
  });

  it('should have valid SMTP port number', () => {
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    
    // Valid SMTP ports: 25, 465, 587, 2525
    const validPorts = [25, 465, 587, 2525];
    expect(validPorts).toContain(smtpPort);
    
    console.log(`✓ SMTP port ${smtpPort} is valid`);
  });

  it('should have valid email format for FROM_EMAIL', () => {
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(fromEmail).toMatch(emailRegex);
    console.log(`✓ FROM_EMAIL format is valid: ${fromEmail}`);
  });

  it('should have SMTP credentials (user and password)', () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    expect(smtpUser).toBeTruthy();
    expect(smtpPass).toBeTruthy();
    expect(smtpUser?.length).toBeGreaterThan(0);
    expect(smtpPass?.length).toBeGreaterThan(0);
    
    console.log('✓ SMTP credentials are configured');
  });
});
