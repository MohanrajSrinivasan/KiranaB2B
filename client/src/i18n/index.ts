import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "dashboard": "Dashboard",
      "products": "Products",
      "orders": "Orders",
      "inventory": "Inventory",
      "analytics": "Analytics",
      "settings": "Settings",
      "logout": "Logout",
      
      // Common
      "loading": "Loading...",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",
      "delete": "Delete",
      "add": "Add",
      "search": "Search",
      "filter": "Filter",
      "total": "Total",
      "quantity": "Quantity",
      "price": "Price",
      "status": "Status",
      
      // Authentication
      "login": "Login",
      "register": "Register",
      "email": "Email",
      "password": "Password",
      "name": "Name",
      "phone": "Phone Number",
      "shopName": "Shop Name",
      "region": "Region",
      "role": "Role",
      
      // Products
      "productName": "Product Name",
      "category": "Category",
      "description": "Description",
      "inStock": "In Stock",
      "outOfStock": "Out of Stock",
      "addToCart": "Add to Cart",
      "viewDetails": "View Details",
      
      // Orders
      "orderHistory": "Order History",
      "orderNumber": "Order #",
      "orderDate": "Order Date",
      "orderStatus": "Order Status",
      "pending": "Pending",
      "confirmed": "Confirmed", 
      "shipped": "Shipped",
      "delivered": "Delivered",
      "cancelled": "Cancelled",
      "placeOrder": "Place Order",
      "orderTotal": "Order Total",
      
      // Analytics
      "totalSales": "Total Sales",
      "totalOrders": "Total Orders",
      "totalCustomers": "Total Customers",
      "revenue": "Revenue",
      "growth": "Growth",
      "thisMonth": "This Month",
      "lastMonth": "Last Month",
      
      // Inventory
      "stockLevel": "Stock Level",
      "lowStock": "Low Stock",
      "restockAlert": "Restock Alert",
      "lastRestock": "Last Restock",
      
      // Messages
      "orderPlacedSuccess": "Order placed successfully!",
      "orderPlacedError": "Failed to place order. Please try again.",
      "loginSuccess": "Login successful!",
      "loginError": "Invalid credentials. Please try again.",
      "profileUpdated": "Profile updated successfully!",
      
      // Roles
      "admin": "Administrator",
      "vendor": "Kirana Store Owner",
      "retail_user": "Retail Customer"
    }
  },
  ta: {
    translation: {
      // Navigation
      "dashboard": "டாஷ்போர்டு",
      "products": "பொருட்கள்",
      "orders": "ஆர்டர்கள்",
      "inventory": "இன்வென்டரி",
      "analytics": "அனலிட்டிக்ஸ்",
      "settings": "அமைப்புகள்",
      "logout": "வெளியேறு",
      
      // Common
      "loading": "ஏற்றுகிறது...",
      "save": "சேமி",
      "cancel": "ரத்து செய்",
      "edit": "திருத்து",
      "delete": "நீக்கு",
      "add": "சேர்",
      "search": "தேடு",
      "filter": "வடிகட்டு",
      "total": "மொத்தம்",
      "quantity": "அளவு",
      "price": "விலை",
      "status": "நிலை",
      
      // Authentication
      "login": "உள்நுழை",
      "register": "பதிவு செய்",
      "email": "மின்னஞ்சல்",
      "password": "கடவுச்சொல்",
      "name": "பெயர்",
      "phone": "தொலைபேசி எண்",
      "shopName": "கடை பெயர்",
      "region": "பகுதி",
      "role": "பதவி",
      
      // Products
      "productName": "பொருளின் பெயர்",
      "category": "வகை",
      "description": "விவரம்",
      "inStock": "இருப்பில் உள்ளது",
      "outOfStock": "இருப்பில் இல்லை",
      "addToCart": "கார்ட்டில் சேர்",
      "viewDetails": "விவரங்களைப் பார்",
      
      // Orders
      "orderHistory": "ஆர்டர் வரலாறு",
      "orderNumber": "ஆர்டர் #",
      "orderDate": "ஆர்டர் தேதி",
      "orderStatus": "ஆர்டர் நிலை",
      "pending": "நிலுவையில்",
      "confirmed": "உறுதி செய்யப்பட்டது",
      "shipped": "அனுப்பப்பட்டது",
      "delivered": "வழங்கப்பட்டது",
      "cancelled": "ரத்து செய்யப்பட்டது",
      "placeOrder": "ஆர்டர் செய்",
      "orderTotal": "ஆர்டர் மொத்தம்",
      
      // Analytics
      "totalSales": "மொத்த விற்பனை",
      "totalOrders": "மொத்த ஆர்டர்கள்",
      "totalCustomers": "மொத்த வாடிக்கையாளர்கள்",
      "revenue": "வருமானம்",
      "growth": "வளர்ச்சி",
      "thisMonth": "இந்த மாதம்",
      "lastMonth": "கடந்த மாதம்",
      
      // Inventory
      "stockLevel": "இருப்பு நிலை",
      "lowStock": "குறைந்த இருப்பு",
      "restockAlert": "மீண்டும் நிரப்பல் எச்சரிக்கை",
      "lastRestock": "கடைசி மீண்டும் நிரப்பல்",
      
      // Messages
      "orderPlacedSuccess": "ஆர்டர் வெற்றிகரமாக செய்யப்பட்டது!",
      "orderPlacedError": "ஆர்டர் செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
      "loginSuccess": "உள்நுழைவு வெற்றிகரமானது!",
      "loginError": "தவறான விவரங்கள். மீண்டும் முயற்சிக்கவும்.",
      "profileUpdated": "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
      
      // Roles
      "admin": "நிர்வாகி",
      "vendor": "கிரானா கடை உரிமையாளர்",
      "retail_user": "சில்லறை வாடிக்கையாளர்"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;