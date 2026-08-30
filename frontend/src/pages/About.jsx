import React from 'react';
import { Award, Users, Leaf, Heart, MapPin } from 'lucide-react';

export default function About() {
  const stats = [
    { number: '25+', label: 'Years of Legacy' },
    { number: '200+', label: 'Master Karigars' },
    { number: '50K+', label: 'Happy Families' },
    { number: '18', label: 'States Delivered' },
  ];

  const values = [
    { icon: Award, title: 'Heritage Craft', description: 'Every piece carries the legacy of traditional Indian woodworking, perfected over generations in Rajasthan and Kerala.' },
    { icon: Users, title: 'Karigar Welfare', description: 'We provide fair wages, healthcare, and education support to our artisan families across India.' },
    { icon: Leaf, title: 'Make in India', description: 'Proudly crafted in India using sustainably sourced Sheesham, Teak, and Mango wood from certified forests.' },
    { icon: Heart, title: 'Customer First', description: 'From design consultation to doorstep delivery, we ensure a seamless experience for every customer.' },
  ];

  const team = [
    { name: 'Arjun Mehta', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400' },
    { name: 'Priya Sharma', role: 'Creative Director', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400' },
    { name: 'Rajesh Kumar', role: 'Head of Craftsmanship', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400' },
    { name: 'Ananya Reddy', role: 'Operations Head', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400' },
  ];

  const workshops = [
    { city: 'Jodhpur', specialty: 'Sheesham & Brass Inlay Work' },
    { city: 'Saharanpur', specialty: 'Traditional Wood Carving' },
    { city: 'Aluva (Kerala)', specialty: 'Teak Wood Furniture' },
    { city: 'Channapatna', specialty: 'Lacquerware & Toys' },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-stone-100 py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500 mb-6">Our Story</p>
            <h1 className="text-5xl md:text-6xl font-serif mb-8 leading-tight">
              Preserving India's<br />
              <span className="italic">Craft Heritage</span>
            </h1>
            <p className="text-stone-600 text-xl leading-relaxed">
              Founded in 1999, ArtisanLoft began with a mission to revive India's glorious tradition of handcrafted furniture while providing sustainable livelihoods to master karigars across the country.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800" 
                alt="Artisan workshop"
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-serif mb-6">Where Parampara Meets Design</h2>
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>
                  What started as a small karkhana in Jodhpur has grown into a network of over 200 master karigars across Rajasthan, Kerala, and Karnataka—each bringing generations of expertise in traditional Indian woodworking.
                </p>
                <p>
                  We believe furniture is not just utility—it's a legacy. Each piece carries the soul of its maker and becomes part of your family's story, passed down from generation to generation.
                </p>
                <p>
                  Our commitment to sustainability means we source only FSC-certified Indian hardwoods, use natural finishes, and ensure zero-waste manufacturing through precision crafting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshops */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif mb-4">Our Workshops Across India</h2>
            <p className="text-stone-500">Each region brings its unique craft tradition</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workshops.map((workshop, index) => (
              <div key={index} className="bg-white p-6 text-center border border-stone-200">
                <MapPin className="w-8 h-8 mx-auto mb-4 text-orange-500" />
                <h3 className="font-serif text-xl mb-2">{workshop.city}</h3>
                <p className="text-stone-500 text-sm">{workshop.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-stone-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-5xl font-serif mb-2">{stat.number}</p>
                <p className="text-stone-400 text-sm uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif mb-4">Our Values</h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              The principles that guide everything we create
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-8 bg-stone-50">
                <value.icon className="w-10 h-10 mx-auto mb-6 text-stone-700" />
                <h3 className="text-xl font-serif mb-3">{value.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif mb-4">Meet the Team</h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              The passionate people behind every piece
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full aspect-square object-cover mb-6 grayscale hover:grayscale-0 transition-all duration-500"
                />
                <h3 className="text-lg font-serif mb-1">{member.name}</h3>
                <p className="text-stone-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-serif mb-6">Visit Our Experience Centers</h2>
          <p className="text-stone-600 mb-8 leading-relaxed">
            Touch and feel our craftsmanship at our showrooms in Bangalore, Mumbai, and Delhi. Our design consultants will help you find the perfect pieces for your home.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/contact" 
              className="inline-block px-8 py-4 bg-stone-900 text-white font-semibold uppercase tracking-widest text-sm hover:bg-stone-800 transition-colors"
            >
              Book a Consultation
            </a>
            <a 
              href="/collection" 
              className="inline-block px-8 py-4 border-2 border-stone-900 text-stone-900 font-semibold uppercase tracking-widest text-sm hover:bg-stone-900 hover:text-white transition-colors"
            >
              Explore Collection
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
