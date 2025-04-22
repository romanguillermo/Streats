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
    rating?: number | null;
    reviews: Review[];
    operatingHours: OperatingHours;
    contactInfo: ContactInfo;
    options?: { [groupName: string]: string[]}
    isOpen?: boolean;
  }
  
  export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    photo?: string;
  }

  export interface MenuOption {
    id: string;
    name: string;
    values: string[];
    price: number;
    isSelected?: boolean;
  }

  export interface MenuOptionGroup {
    id: string;
    name: string;
    selectionType: 'single' | 'multiple';
    required?: boolean;
    choices: MenuOptionChoice[];
  }

  export interface MenuOptionChoice {
    id: string;
    name: string;
    priceAdjustment?: number;
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
  
  
  // Helper function for operating hours
  export function isVendorOpen(vendor: Vendor): boolean {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Convert the day name to the property name in oeratingHours interface
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
    
    // format hours to 12h
    const openFormatted = formatTo12Hour(currentHours.open);
    const closeFormatted = formatTo12Hour(currentHours.close);

    return `${openFormatted} - ${closeFormatted}`;
  }

  export function formatTo12Hour(time24: string): string {
    if (!time24 || !time24.includes(':')) {
      return "Invalid Time";
    }
    const parts = time24.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
  
    if (isNaN(hours) || isNaN(minutes)) {
      return "Invalid Time";
    }
  
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  
    return `${hours}:${minutesStr} ${ampm}`;
  }