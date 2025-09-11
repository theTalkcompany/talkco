-- Create terms_of_service table to store editable terms of service content
CREATE TABLE public.terms_of_service (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.terms_of_service ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the terms of service
CREATE POLICY "Terms of service is viewable by everyone" 
ON public.terms_of_service 
FOR SELECT 
USING (true);

-- Only admins can insert/update terms of service
CREATE POLICY "Only admins can insert terms of service" 
ON public.terms_of_service 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update terms of service" 
ON public.terms_of_service 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_terms_of_service_updated_at
BEFORE UPDATE ON public.terms_of_service
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default terms of service content
INSERT INTO public.terms_of_service (content, updated_by) VALUES (
'# Terms of Service

## Welcome to Talk

By accessing and using Talk, our mental health support platform, you agree to be bound by these Terms of Service. Please read them carefully.

## Acceptance of Terms

By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms.

## Description of Service

Talk is a mental health support platform that provides:
- Anonymous chat rooms for peer support
- AI-powered mental health companion (Willow)
- Community feed for sharing experiences
- Crisis resources and professional help information
- Inspirational quotes and mental wellness content

## Important Medical Disclaimer

**Talk is NOT a substitute for professional medical care, therapy, or emergency services.**

- Our AI assistant Willow is not a licensed medical professional
- Community members are not medical professionals
- Do not use this platform for medical emergencies
- Always consult qualified healthcare providers for medical advice
- In crisis situations, contact emergency services or crisis hotlines immediately

## User Responsibilities

### Appropriate Use
- Use the platform respectfully and constructively
- Provide support and encouragement to other community members
- Report inappropriate content or behavior
- Respect others'' privacy and anonymity

### Prohibited Conduct
You agree NOT to:
- Share personal identifying information (yours or others'')
- Provide medical advice or diagnosis
- Engage in harassment, bullying, or discriminatory behavior
- Share harmful, threatening, or self-harm encouraging content
- Spam, advertise, or promote external services
- Attempt to bypass security measures or access restrictions

## Privacy and Anonymity

- We prioritize user anonymity and privacy
- Display names are optional - you can remain anonymous
- Chat messages are designed to protect your identity
- See our Privacy Policy for detailed information handling practices

## Content and Community Guidelines

### User Generated Content
- You retain ownership of your content
- You grant us license to display and moderate your content
- We reserve the right to remove inappropriate content
- Content should be supportive and constructive in nature

### Community Standards
- Maintain a supportive, non-judgmental environment
- Respect diverse backgrounds and experiences
- Focus on recovery, healing, and mutual support
- Follow crisis protocol guidelines when appropriate

## Crisis and Safety Protocols

### Immediate Danger
If you or someone else is in immediate danger:
- Call emergency services (911, 999, 112, etc.)
- Contact local crisis hotlines
- Go to the nearest emergency department
- Do not rely solely on this platform for crisis intervention

### Platform Response
- We may take immediate action for safety concerns
- Reported crisis situations will be handled with appropriate urgency
- We may contact emergency services if legally required

## Account Management

### Registration
- Accounts require valid email addresses
- You are responsible for account security
- One account per person
- Accurate information is required where provided

### Account Termination
We reserve the right to suspend or terminate accounts for:
- Violation of these terms
- Inappropriate or harmful behavior
- Safety concerns
- Inactivity (after reasonable notice)

## Age Requirements

- Users must be at least 13 years old
- Users under 18 should have parental guidance
- Some features may have additional age restrictions
- Appropriate crisis resources will be provided based on age and location

## Intellectual Property

### Platform Content
- Talk owns the platform, design, and operational content
- Users may not copy, modify, or distribute platform elements
- Third-party content is used under appropriate licenses

### User Content
- You retain rights to your original content
- You grant us necessary licenses for platform operation
- Respect others'' intellectual property rights

## Limitation of Liability

**IMPORTANT:** TO THE MAXIMUM EXTENT PERMITTED BY LAW:

- Talk is provided "as is" without warranties
- We are not liable for user-generated content
- We are not liable for medical outcomes or decisions
- Users assume responsibility for their own health and safety
- Our liability is limited to the maximum extent permitted by law

## Service Availability

- We strive for reliable service but cannot guarantee 100% uptime
- Maintenance and updates may temporarily affect availability
- We reserve the right to modify or discontinue features
- Crisis resources remain available even during platform maintenance

## Changes to Terms

- We may update these terms periodically
- Users will be notified of significant changes
- Continued use constitutes acceptance of updated terms
- Previous versions remain accessible for reference

## Governing Law

These terms are governed by the laws of the jurisdiction where Talk operates, without regard to conflict of law principles.

## Contact Information

For questions about these Terms of Service:
- Use our in-app support features
- Contact us through official support channels
- Reference our Privacy Policy for data-related inquiries

## Severability

If any provision of these terms is found unenforceable, the remaining provisions continue in full effect.

## Entire Agreement

These Terms of Service, along with our Privacy Policy, constitute the entire agreement between you and Talk.

---

**Remember: Your mental health and safety are our top priorities. Please use this platform responsibly and seek professional help when needed.**

Last updated: ' || to_char(now(), 'Month DD, YYYY'),
(SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)
);