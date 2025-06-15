import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "dashboard": "Dashboard",
      "products": "Products",
      "orders": "Orders",
      "analytics": "Analytics",
      "inventory": "Inventory",
      "profile": "Profile",
      "logout": "Logout",
      "login": "Login",
      "register": "Register",
      
      // Common
      "loading": "Loading...",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "search": "Search",
      "filter": "Filter",
      "total": "Total",
      "status": "Status",
      "date": "Date",
      "name": "Name",
      "email": "Email",
      "phone": "Phone",
      "address": "Address",
      
      // Auth
      "welcome": "Welcome to KiranaConnect",
      "signin": "Sign In",
      "signup": "Sign Up",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "forgotPassword": "Forgot Password?",
      
      // Products
      "productName": "Product Name",
      "category": "Category",
      "price": "Price",
      "stock": "Stock",
      "description": "Description",
      "addProduct": "Add Product",
      "editProduct": "Edit Product",
      
      // Orders
      "orderId": "Order ID",
      "orderDate": "Order Date",
      "orderStatus": "Order Status",
      "orderTotal": "Order Total",
      "pending": "Pending",
      "confirmed": "Confirmed",
      "shipped": "Shipped",
      "delivered": "Delivered",
      "cancelled": "Cancelled",
      
      // Kirana specific
      "bulkOrder": "Bulk Order",
      "wholesalePrice": "Wholesale Price",
      "minimumQuantity": "Minimum Quantity",
      "shopName": "Shop Name",
      "region": "Region",
      
      // Analytics
      "revenue": "Revenue",
      "customers": "Customers",
      "growth": "Growth",
      "topProducts": "Top Products",
      "recentOrders": "Recent Orders",
      "lowStock": "Low Stock Items"
    }
  },
  ta: {
    translation: {
      // Navigation
      "dashboard": "டாஷ்போர்டு",
      "products": "தயாரிப்புகள்",
      "orders": "ஆர்டர்கள்",
      "analytics": "பகுப்பாய்வு",
      "inventory": "சரக்கு",
      "profile": "சுயவிவரம்",
      "logout": "வெளியேறு",
      "login": "உள்நுழை",
      "register": "பதிவு செய்",
      
      // Common
      "loading": "ஏற்றுகிறது...",
      "save": "சேமி",
      "cancel": "ரத்து செய்",
      "delete": "நீக்கு",
      "edit": "திருத்து",
      "add": "சேர்",
      "search": "தேடு",
      "filter": "வடிகட்டு",
      "total": "மொத்தம்",
      "status": "நிலை",
      "date": "தேதி",
      "name": "பெயர்",
      "email": "மின்னஞ்சல்",
      "phone": "தொலைபேசி",
      "address": "முகவரி",
      
      // Auth
      "welcome": "கிரானாகனெக்ட்டுக்கு வரவேற்கிறோம்",
      "signin": "உள்நுழைய",
      "signup": "பதிவு செய்ய",
      "password": "கடவுச்சொல்",
      "confirmPassword": "கடவுச்சொல்லை உறுதிப்படுத்து",
      "forgotPassword": "கடவுச்சொல் மறந்துவிட்டதா?",
      
      // Products
      "productName": "தயாரிப்பு பெயர்",
      "category": "வகை",
      "price": "விலை",
      "stock": "சரக்கு",
      "description": "விளக்கம்",
      "addProduct": "தயாரிப்பு சேர்",
      "editProduct": "தயாரிப்பு திருத்து",
      
      // Orders
      "orderId": "ஆர்டர் ஐடி",
      "orderDate": "ஆர்டர் தேதி",
      "orderStatus": "ஆர்டர் நிலை",
      "orderTotal": "ஆர்டர் மொத்தம்",
      "pending": "நிலுவையில்",
      "confirmed": "உறுதிப்படுத்தப்பட்டது",
      "shipped": "அனுப்பப்பட்டது",
      "delivered": "வழங்கப்பட்டது",
      "cancelled": "ரத்து செய்யப்பட்டது",
      
      // Kirana specific
      "bulkOrder": "மொத்த ஆர்டர்",
      "wholesalePrice": "மொத்த விலை",
      "minimumQuantity": "குறைந்தபட்ச அளவு",
      "shopName": "கடை பெயர்",
      "region": "பகுதி",
      
      // Analytics
      "revenue": "வருவாய்",
      "customers": "வாடிக்கையாளர்கள்",
      "growth": "வளர்ச்சி",
      "topProducts": "சிறந்த தயாரிப்புகள்",
      "recentOrders": "சமீபத்திய ஆர்டர்கள்",
      "lowStock": "குறைந்த சரக்கு"
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