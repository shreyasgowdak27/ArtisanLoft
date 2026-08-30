import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Contact() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Your message has been sent! We will get back to you within 24 hours.');
  };

  const contactInfo = [
    { icon: MapPin, title: 'Head Office', lines: ['42, MG Road, Indiranagar', 'Bangalore, Karnataka 560038'] },
    { icon: Phone, title: 'Call Us', lines: ['+91 80 4567 8900', 'Toll Free: 1800-123-4567'] },
    { icon: Mail, title: 'Email Us', lines: ['care@artisanloft.in', 'orders@artisanloft.in'] },
    { icon: Clock, title: 'Working Hours', lines: ['Mon-Sat: 10AM - 7PM IST', 'Sunday: 11AM - 5PM IST'] },
  ];

  const showrooms = [
    { city: 'Bangalore', address: '42, MG Road, Indiranagar', phone: '+91 80 4567 8900' },
    { city: 'Mumbai', address: 'Linking Road, Bandra West', phone: '+91 22 4567 8900' },
    { city: 'Delhi NCR', address: 'DLF Cyber Hub, Gurugram', phone: '+91 124 456 7890' },
    { city: 'Chennai', address: 'Nungambakkam High Road', phone: '+91 44 4567 8900' },
  ];

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
              Have questions about our collection? Need design advice for your home? Our team of experts is here to help you find the perfect furniture.
            </p>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-green-600 py-4">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-center gap-4 text-white">
          <MessageCircle className="w-6 h-6" />
          <span className="font-medium">Quick Response on WhatsApp!</span>
          <a href="https://wa.me/917760478724" className="bg-white text-green-600 px-4 py-2 rounded text-sm font-semibold hover:bg-green-50">
            Chat Now
          </a>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div>
              <h2 className="text-3xl font-serif mb-8">Send Us a Message</h2>
              
              {submitted ? (
                <div className="bg-green-50 border border-green-200 p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-serif mb-3">Message Sent!</h3>
                  <p className="text-stone-600 mb-6">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                  <button 
                    onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                    className="text-stone-900 underline hover:no-underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        Your Name *
                      </label>
                      <input 
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                        placeholder="Rahul Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        Phone Number *
                      </label>
                      <input 
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        Email Address *
                      </label>
                      <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                        placeholder="rahul@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                        City *
                      </label>
                      <input 
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                        placeholder="Bangalore"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                      Subject *
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors"
                    >
                      <option value="">Select a subject</option>
                      <option value="product">Product Inquiry</option>
                      <option value="order">Order Support</option>
                      <option value="design">Design Consultation</option>
                      <option value="visit">Schedule Showroom Visit</option>
                      <option value="custom">Custom/Bulk Order Request</option>
                      <option value="franchise">Franchise Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-stone-500 mb-2">
                      Message *
                    </label>
                    <textarea 
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-4 bg-stone-50 border border-stone-200 outline-none focus:border-stone-900 transition-colors resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
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
                        <p className="text-stone-500 text-sm mt-2">{showroom.phone}</p>
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
              
              <div className="bg-orange-50 border border-orange-200 p-6 mt-6">
                <h3 className="font-medium text-orange-800 mb-2">📞 Prefer talking to us?</h3>
                <p className="text-orange-700 text-sm mb-3">Our furniture experts are available to help you choose the perfect pieces.</p>
                <p className="font-semibold text-orange-900">Toll Free: 1800-123-4567</p>
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
