export interface Vendor {
    id: string;
    name: string;
    description: string;
    cuisineType: string;
    location: {
      latitude: number;
      longitude: number;
    };
    menu: MenuItem[];
    photos: string[];
    rating: number;
    reviews: Review[];
    operatingHours: OperatingHours;
    contactInfo: ContactInfo;
    isOpen?: boolean;
  }
  
  export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    photo?: string;
  }
  
  export interface Review {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
  }
  
  export interface OperatingHours {
    monday?: TimeRange;
    tuesday?: TimeRange;
    wednesday?: TimeRange;
    thursday?: TimeRange;
    friday?: TimeRange;
    saturday?: TimeRange;
    sunday?: TimeRange;
  }
  
  export interface TimeRange {
    open: string; // Format: "HH:MM"
    close: string; // Format: "HH:MM"
  }
  
  export interface ContactInfo {
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    twitter?: string;
  }
  
  // Sample data
  export const sampleVendors: Vendor[] = [
    {
      id: '1',
      name: 'Taco Truck',
      description: 'Authentic street tacos with homemade salsas and fresh ingredients.',
      cuisineType: 'Mexican',
      location: {
        latitude: 34.052235,  // Slightly offset from default to show on map
        longitude: -118.243683,
      },
      menu: [
        {
          id: '101',
          name: 'Carne Asada Taco',
          description: 'Grilled steak with cilantro, onions, and salsa',
          price: 3.5,
        },
        {
          id: '102',
          name: 'Al Pastor Taco',
          description: 'Marinated pork with pineapple, cilantro, and onions',
          price: 3.5,
        },
      ],
      photos: [],
      rating: 4.7,
      reviews: [
        {
          id: '201',
          userId: 'user1',
          userName: 'TacoLover',
          rating: 5,
          comment: 'Best tacos in LA! The salsa is amazing.',
          date: '2024-11-15',
        },
      ],
      operatingHours: {
        monday: { open: '11:00', close: '22:00' },
        tuesday: { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday: { open: '11:00', close: '23:00' },
        friday: { open: '11:00', close: '23:00' },
        saturday: { open: '12:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' },
      },
      contactInfo: {
        phone: 'xxx-xxx-xxxx',
        instagram: '@instagram_handle',
      },
    },
    {
      id: '2',
      name: 'Sushi on Wheels',
      description: 'Fresh sushi rolls and Japanese street food made to order.',
      cuisineType: 'Japanese',
      location: {
        latitude: 34.053456,
        longitude: -118.242123,
      },
      menu: [
        {
          id: '201',
          name: 'California Roll',
          description: 'Crab, avocado, and cucumber',
          price: 8.99,
        },
        {
          id: '202',
          name: 'Spicy Tuna Roll',
          description: 'Fresh tuna with spicy mayo',
          price: 9.99,
        },
      ],
      photos: [],
      rating: 4.5,
      reviews: [
        {
          id: '301',
          userId: 'user2',
          userName: 'SushiFan',
          rating: 4,
          comment: 'Very good for food truck sushi! Fresh ingredients.',
          date: '2023-10-20',
        },
      ],
      operatingHours: {
        monday: { open: '11:30', close: '20:00' },
        tuesday: { open: '11:30', close: '20:00' },
        wednesday: { open: '11:30', close: '20:00' },
        thursday: { open: '11:30', close: '20:00' },
        friday: { open: '11:30', close: '21:00' },
        saturday: { open: '12:00', close: '21:00' },
      },
      contactInfo: {
        phone: '555-987-6543',
        website: 'sushionwheels.com',
      },
    },
    {
      id: '3',
      name: 'Burgers',
      description: 'Gourmet burgers made with locally-sourced, organic ingredients.',
      cuisineType: 'American',
      location: {
        latitude: 34.051123,
        longitude: -118.244567,
      },
      menu: [
        {
          id: '301',
          name: 'Classic Cheeseburger',
          description: 'Beef patty with cheddar, lettuce, tomato, and special sauce',
          price: 10.99,
        },
        {
          id: '302',
          name: 'Veggie Burger',
          description: 'House-made veggie patty with avocado and sprouts',
          price: 11.99,
        },
      ],
      photos: [],
      rating: 4.8,
      reviews: [
        {
          id: '401',
          userId: 'user3',
          userName: 'BurgerKing',
          rating: 5,
          comment: 'Best burger in town! The special sauce is amazing.',
          date: '2023-11-05',
        },
      ],
      operatingHours: {
        wednesday: { open: '11:00', close: '8:00' },
        thursday: { open: '11:00', close: '8:00' },
        friday: { open: '11:00', close: '10:00' },
        saturday: { open: '11:00', close: '11:00' },
        sunday: { open: '11:00', close: '10:00' },
      },
      contactInfo: {
        phone: '555-456-7890',
        instagram: '@burger_bliss',
      },
    }
  ];
  
  // Helper function to check if a vendor is currently open
  export function isVendorOpen(vendor: Vendor): boolean {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Convert the day name to the property name in our OperatingHours interface
    let day: keyof OperatingHours;
    switch(dayName) {
      case 'monday': day = 'monday'; break;
      case 'tuesday': day = 'tuesday'; break;
      case 'wednesday': day = 'wednesday'; break;
      case 'thursday': day = 'thursday'; break;
      case 'friday': day = 'friday'; break;
      case 'saturday': day = 'saturday'; break;
      case 'sunday': day = 'sunday'; break;
      default: day = 'monday'; // fallback
    }

    const currentHours = vendor.operatingHours[day];
    
    if (!currentHours) return false;
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHours, openMinutes] = currentHours.open.split(':').map(Number);
    const [closeHours, closeMinutes] = currentHours.close.split(':').map(Number);
    
    const openTime = openHours * 60 + openMinutes;
    const closeTime = closeHours * 60 + closeMinutes;
    
    return currentTime >= openTime && currentTime <= closeTime;
  }
  
  // Helper function to get a formatted string of today's hours
  export function getTodayHours(vendor: Vendor): string {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Convert the day name to the property name in OperatingHours interface
    let day: keyof OperatingHours;
    switch(dayName) {
      case 'monday': day = 'monday'; break;
      case 'tuesday': day = 'tuesday'; break;
      case 'wednesday': day = 'wednesday'; break;
      case 'thursday': day = 'thursday'; break;
      case 'friday': day = 'friday'; break;
      case 'saturday': day = 'saturday'; break;
      case 'sunday': day = 'sunday'; break;
      default: day = 'monday'; // fallback
    }
    
    const currentHours = vendor.operatingHours[day];
    
    if (!currentHours) return 'Closed today';
    
    return `${currentHours.open} - ${currentHours.close}`;
  }