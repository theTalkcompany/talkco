-- Create privacy_policy table to store editable privacy policy content
CREATE TABLE public.privacy_policy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.privacy_policy ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the privacy policy
CREATE POLICY "Privacy policy is viewable by everyone" 
ON public.privacy_policy 
FOR SELECT 
USING (true);

-- Only admins can insert/update privacy policy
CREATE POLICY "Only admins can insert privacy policy" 
ON public.privacy_policy 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update privacy policy" 
ON public.privacy_policy 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_privacy_policy_updated_at
BEFORE UPDATE ON public.privacy_policy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default privacy policy content
INSERT INTO public.privacy_policy (content, updated_by) VALUES (
'# Privacy Policy

## Introduction
This Privacy Policy describes how Talk ("we", "our", or "us") collects, uses, and protects your information when you use our mental health support platform.

## Information We Collect
- **Account Information**: Username, email address, and profile information you provide
- **Chat Messages**: Messages you send in our chat rooms and to our AI assistant Willow
- **Usage Data**: Information about how you use our platform
- **Technical Data**: IP address, browser type, and device information

## How We Use Your Information
- To provide and improve our mental health support services
- To facilitate communication in chat rooms and with our AI assistant
- To ensure platform safety and security
- To comply with legal requirements

## Data Protection
- All personal data is encrypted in transit and at rest
- We implement industry-standard security measures
- Access to personal data is restricted to authorized personnel only

## Your Rights
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Export your data

## Anonymous Support
- Our platform is designed to provide anonymous mental health support
- We do not require real names or identifying information
- Chat messages are designed to be anonymous

## Data Retention
- Account data is retained while your account is active
- Chat messages may be retained for safety and moderation purposes
- You can request deletion of your data at any time

## Contact Us
If you have questions about this Privacy Policy, please contact us through our support channels.

## Changes to This Policy
We may update this Privacy Policy from time to time. We will notify users of significant changes.

Last updated: ' || to_char(now(), 'Month DD, YYYY'),
(SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1)
);