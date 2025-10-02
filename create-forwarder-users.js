const mongoose = require('mongoose');
const User = require('./schemas/User');
const ForwarderProfile = require('./schemas/ForwarderProfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function createForwarderUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ai-export-project');
    console.log('Connected to MongoDB');

    // Create different types of forwarders
    const forwarders = [
      {
        user: {
          name: 'Mumbai Pickup Forwarder',
          email: 'pickup@forwarder.com',
          password: 'test123',
          role: 'forwarder',
          phone: '+91-9876543210',
          company: 'Mumbai Logistics Ltd'
        },
        profile: {
          specialization: ['pickup'],
          serviceAreas: [{
            country: 'India',
            state: 'Maharashtra',
            city: 'Mumbai',
            port: 'Mumbai Port',
            coordinates: { latitude: 19.0760, longitude: 72.8777 }
          }],
          businessInfo: {
            companyName: 'Mumbai Logistics Ltd',
            registrationNumber: 'MH123456789',
            phone: '+91-9876543210',
            email: 'pickup@forwarder.com',
            address: {
              street: '123 Logistics Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              zipCode: '400001'
            }
          },
          capacity: {
            maxConcurrentShipments: 15,
            currentLoad: 0,
            averageProcessingTime: 4
          }
        }
      },
      {
        user: {
          name: 'Transit Forwarder',
          email: 'transit@forwarder.com',
          password: 'test123',
          role: 'forwarder',
          phone: '+91-9876543211',
          company: 'Transit Solutions Pvt Ltd'
        },
        profile: {
          specialization: ['transit'],
          serviceAreas: [{
            country: 'India',
            state: 'Maharashtra',
            city: 'Mumbai',
            port: 'Mumbai Port',
            coordinates: { latitude: 19.0760, longitude: 72.8777 }
          }, {
            country: 'India',
            state: 'Gujarat',
            city: 'Ahmedabad',
            port: 'Ahmedabad Port',
            coordinates: { latitude: 23.0225, longitude: 72.5714 }
          }],
          businessInfo: {
            companyName: 'Transit Solutions Pvt Ltd',
            registrationNumber: 'GJ123456789',
            phone: '+91-9876543211',
            email: 'transit@forwarder.com',
            address: {
              street: '456 Transit Road',
              city: 'Ahmedabad',
              state: 'Gujarat',
              country: 'India',
              zipCode: '380001'
            }
          },
          capacity: {
            maxConcurrentShipments: 20,
            currentLoad: 0,
            averageProcessingTime: 8
          }
        }
      },
      {
        user: {
          name: 'Port Loading Forwarder',
          email: 'port@forwarder.com',
          password: 'test123',
          role: 'forwarder',
          phone: '+91-9876543212',
          company: 'Port Operations Ltd'
        },
        profile: {
          specialization: ['port_loading'],
          serviceAreas: [{
            country: 'India',
            state: 'Maharashtra',
            city: 'Mumbai',
            port: 'Mumbai Port',
            coordinates: { latitude: 19.0760, longitude: 72.8777 }
          }],
          businessInfo: {
            companyName: 'Port Operations Ltd',
            registrationNumber: 'MH987654321',
            phone: '+91-9876543212',
            email: 'port@forwarder.com',
            address: {
              street: '789 Port Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              zipCode: '400001'
            }
          },
          capacity: {
            maxConcurrentShipments: 25,
            currentLoad: 0,
            averageProcessingTime: 12
          },
          equipment: [{
            type: 'crane',
            capacity: '50 tons',
            specifications: 'Heavy duty port crane',
            registrationNumber: 'CR001',
            lastInspection: new Date('2024-01-01'),
            nextInspection: new Date('2024-07-01')
          }]
        }
      },
      {
        user: {
          name: 'On-Ship Forwarder',
          email: 'onship@forwarder.com',
          password: 'test123',
          role: 'forwarder',
          phone: '+91-9876543213',
          company: 'Maritime Tracking Ltd'
        },
        profile: {
          specialization: ['on_ship'],
          serviceAreas: [{
            country: 'India',
            state: 'Maharashtra',
            city: 'Mumbai',
            port: 'Mumbai Port',
            coordinates: { latitude: 19.0760, longitude: 72.8777 }
          }, {
            country: 'USA',
            state: 'New York',
            city: 'New York',
            port: 'New York Port',
            coordinates: { latitude: 40.7128, longitude: -74.0060 }
          }],
          businessInfo: {
            companyName: 'Maritime Tracking Ltd',
            registrationNumber: 'INT123456789',
            phone: '+91-9876543213',
            email: 'onship@forwarder.com',
            address: {
              street: '321 Maritime Avenue',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              zipCode: '400001'
            }
          },
          capacity: {
            maxConcurrentShipments: 30,
            currentLoad: 0,
            averageProcessingTime: 168 // 7 days
          }
        }
      },
      {
        user: {
          name: 'Destination Unloading Forwarder',
          email: 'destination@forwarder.com',
          password: 'test123',
          role: 'forwarder',
          phone: '+1-555-123-4567',
          company: 'NYC Delivery Solutions'
        },
        profile: {
          specialization: ['destination'],
          serviceAreas: [{
            country: 'USA',
            state: 'New York',
            city: 'New York',
            port: 'New York Port',
            coordinates: { latitude: 40.7128, longitude: -74.0060 }
          }],
          businessInfo: {
            companyName: 'NYC Delivery Solutions',
            registrationNumber: 'NY123456789',
            phone: '+1-555-123-4567',
            email: 'destination@forwarder.com',
            address: {
              street: '456 Delivery Street',
              city: 'New York',
              state: 'New York',
              country: 'USA',
              zipCode: '10001'
            }
          },
          capacity: {
            maxConcurrentShipments: 20,
            currentLoad: 0,
            averageProcessingTime: 6
          },
          equipment: [{
            type: 'truck',
            capacity: '20 tons',
            specifications: 'Heavy duty delivery truck',
            registrationNumber: 'TR001',
            lastInspection: new Date('2024-01-01'),
            nextInspection: new Date('2024-07-01')
          }]
        }
      }
    ];

    console.log('🚚 Creating forwarder users and profiles...');

    for (const forwarderData of forwarders) {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: forwarderData.user.email });
        
        if (!user) {
          // Create user
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(forwarderData.user.password, salt);

          user = new User({
            ...forwarderData.user,
            password: hashedPassword,
            status: 'active'
          });

          await user.save();
          console.log(`✅ Created user: ${user.name} (${user.email})`);
        } else {
          console.log(`⚠️ User already exists: ${user.name} (${user.email})`);
        }

        // Create or update forwarder profile
        let profile = await ForwarderProfile.findOne({ userId: user._id });
        
        if (!profile) {
          profile = new ForwarderProfile({
            userId: user._id,
            ...forwarderData.profile,
            status: 'active',
            verification: {
              isVerified: true,
              verifiedAt: new Date(),
              verifiedBy: null
            }
          });

          await profile.save();
          console.log(`✅ Created profile for: ${user.name}`);
        } else {
          console.log(`⚠️ Profile already exists for: ${user.name}`);
        }

      } catch (error) {
        console.error(`❌ Error creating forwarder ${forwarderData.user.name}:`, error.message);
      }
    }

    console.log('\n🎯 Forwarder Users Created:');
    console.log('========================');
    console.log('1. Mumbai Pickup Forwarder - pickup@forwarder.com / test123');
    console.log('2. Transit Forwarder - transit@forwarder.com / test123');
    console.log('3. Port Loading Forwarder - port@forwarder.com / test123');
    console.log('4. On-Ship Forwarder - onship@forwarder.com / test123');
    console.log('5. Destination Unloading Forwarder - destination@forwarder.com / test123');

    console.log('\n🚀 Next Steps:');
    console.log('1. Start backend: node BE/start-server.js');
    console.log('2. Start frontend: cd FE && npm run dev');
    console.log('3. Login as any forwarder to test the system');
    console.log('4. Create an order as exporter and submit to CA');
    console.log('5. Approve documents as CA to trigger forwarder assignment');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createForwarderUsers();
