import React, { useState } from 'react';
import { MapPin, Mail, Clock, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { sendContactMessage } from '../api/api';

export default function Contact() {
  const toast = useToast();
  const contactEmail = process.env.REACT_APP_CONTACT_EMAIL || 'care@artisanloft.in';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    honeypot: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  const contactInfo = [
    { icon: MapPin, title: 'Head Office', lines: ['42, MG Road, Indiranagar', 'Bangalore, Karnataka 560038'] },
    { icon: Mail, title: 'Email Us', lines: [contactEmail, 'orders@artisanloft.in'] },
    { icon: Clock, title: 'Working Hours', lines: ['Mon-Sat: 10AM - 7PM IST', 'Sunday: 11AM - 5PM IST'] },
  ];

  const showrooms = [
    { city: 'Bangalore', address: '42, MG Road, Indiranagar' },
    { city: 'Mumbai', address: 'Linking Road, Bandra West' },
    { city: 'Delhi NCR', address: 'DLF Cyber Hub, Gurugram' },
    { city: 'Chennai', address: 'Nungambakkam High Road' },
  ];

  const validate = () => {
    const nextErrors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName) {
      nextErrors.name = 'Your name is required';
    } else if (trimmedName.length > 100) {
      nextErrors.name = 'Name must be 100 characters or less';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      nextErrors.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!trimmedMessage) {
      nextErrors.message = 'Message is required';
    } else if (trimmedMessage.length < 10) {
      nextErrors.message = 'Message must be at least 10 characters long';
    } else if (trimmedMessage.length > 1000) {
      nextErrors.message = 'Message must be 1000 characters or less';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        honeypot: formData.honeypot || undefined,
      });

      setSubmitted(true);
      toast.success('Your message has been sent! We will get back to you within 24 hours.');
    } catch (err) {
      if (err.response?.status === 429) {
        setServerError('You have reached the limit of 3 messages per hour. Please try again later.');
        toast.error('Limit reached: 3 messages per hour.');
      } else if (err.response?.status === 422) {
        setServerError('Please ensure all fields are filled out with valid information.');
        toast.error('Validation failed. Please check your inputs.');
      } else {
        setServerError(`Unable to deliver message right now. You can also reach us at ${contactEmail}.`);
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setServerError(null);
    setErrors({});
    setFormData({ name: '', email: '', message: '', honeypot: '' });
  };

  return (
    <main>
      {/* Hero */}
      <section className="bg-stone-100 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-6">Get In Touch</p>
            <h1 className="text-5xl md:text-6xl font-serif mb-8 leading-tight">
              We'd Love to<br />
              <span className="italic">Hear From You</span>
            </h1>
            <p className="text-stone-600 text-xl leading-relaxed">
              Have questions about our collection? Need design advice for your home? Reach out through our contact form or write to us at{' '}
              <a href={`mailto:${contactEmail}`} className="text-stone-900 underline font-medium">
                {contactEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactInfo.map((item, index) => (
              <div key={index} className="bg-white border border-stone-200 p-8 text-center">
                <item.icon className="w-8 h-8 mx-auto mb-4 text-stone-700" />
                <h3 className="font-serif text-lg mb-3">{item.title}</h3>
                {item.lines.map((line, i) => (
                  <p key={i} className="text-stone-500 text-sm">{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Showrooms */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-serif mb-8">Send Us a Message</h2>

              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div className="text-sm">
                    <p className="font-semibold">Message delivery issue</p>
                    <p>{serverError}</p>
                  </div>
                </div>
              )}

              {submitted ? (
                <div className="bg-green-50 border border-green-200 p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-serif mb-3">Message Sent!</h3>
                  <p className="text-stone-600 mb-6">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button
                    onClick={handleReset}
                    className="text-stone-900 underline font-medium hover:no-underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Hidden honeypot field to silently trap spam bots */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <label htmlFor="contact-form-honeypot">Website</label>
                    <input
                      id="contact-form-honeypot"
                      type="text"
                      name="honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-name" className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                      Your Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      disabled={loading}
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      className={`w-full p-4 bg-stone-50 border ${
                        errors.name ? 'border-red-500 focus:border-red-600' : 'border-stone-200 focus:border-stone-900'
                      } outline-none transition-colors disabled:opacity-60`}
                      placeholder="Rahul Sharma"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      disabled={loading}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full p-4 bg-stone-50 border ${
                        errors.email ? 'border-red-500 focus:border-red-600' : 'border-stone-200 focus:border-stone-900'
                      } outline-none transition-colors disabled:opacity-60`}
                      placeholder="rahul@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="contact-message" className="block text-xs uppercase tracking-widest font-bold text-stone-500">
                        Message *
                      </label>
                      <span className="text-xs text-stone-400">
                        {formData.message.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="contact-message"
                      rows={6}
                      disabled={loading}
                      maxLength={1000}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: '' });
                      }}
                      className={`w-full p-4 bg-stone-50 border ${
                        errors.message ? 'border-red-500 focus:border-red-600' : 'border-stone-200 focus:border-stone-900'
                      } outline-none transition-colors resize-none disabled:opacity-60`}
                      placeholder="Tell us how we can help..."
                    />
                    {errors.message && (
                      <p className="text-red-600 text-xs mt-1.5">{errors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Showrooms */}
            <div>
              <h2 className="text-3xl font-serif mb-8">Our Showrooms</h2>
              <div className="space-y-4">
                {showrooms.map((showroom, index) => (
                  <div key={index} className="bg-stone-50 p-6 border border-stone-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-serif text-lg mb-1">{showroom.city}</h3>
                        <p className="text-stone-600 text-sm">{showroom.address}</p>
                      </div>
                      <a
                        href={`https://maps.google.com?q=${encodeURIComponent(showroom.address + ' ' + showroom.city)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 text-sm hover:underline"
                      >
                        Get Directions →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-stone-50 border border-stone-200 p-6 mt-6">
                <h3 className="font-medium text-stone-900 mb-2">Need quick assistance?</h3>
                <p className="text-stone-600 text-sm mb-3">Our furniture specialists respond promptly to all email inquiries.</p>
                <a href={`mailto:${contactEmail}`} className="font-medium text-stone-900 underline hover:no-underline text-sm">
                  {contactEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-serif mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6 text-left">
            <div className="bg-white p-6 border border-stone-200">
              <h3 className="font-medium mb-2">What is the delivery time?</h3>
              <p className="text-stone-600 text-sm">Most items are delivered within 7-15 business days across India. Metro cities usually receive faster delivery in 5-7 days.</p>
            </div>
            <div className="bg-white p-6 border border-stone-200">
              <h3 className="font-medium mb-2">Do you offer assembly services?</h3>
              <p className="text-stone-600 text-sm">Yes! Free assembly is included with all orders above ₹25,000. Our trained technicians will set up your furniture at your home.</p>
            </div>
            <div className="bg-white p-6 border border-stone-200">
              <h3 className="font-medium mb-2">What is your return policy?</h3>
              <p className="text-stone-600 text-sm">We offer a 7-day return policy for manufacturing defects. Custom-made orders are non-returnable. EMI cancellation charges may apply.</p>
            </div>
            <div className="bg-white p-6 border border-stone-200">
              <h3 className="font-medium mb-2">Do you offer EMI options?</h3>
              <p className="text-stone-600 text-sm">Yes! No-cost EMI is available on all major credit cards for orders above ₹10,000. We also partner with Bajaj Finserv and ZestMoney.</p>
            </div>
            <div className="bg-white p-6 border border-stone-200">
              <h3 className="font-medium mb-2">Is Cash on Delivery available?</h3>
              <p className="text-stone-600 text-sm">COD is available for orders up to ₹50,000 in select cities. A nominal COD fee of ₹99 applies.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
