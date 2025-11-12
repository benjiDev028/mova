import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import MainNavigator from './src/navigation/MainNavigator';
import { StripeProvider } from '@stripe/stripe-react-native'; 
import { AuthProvider } from './src/context/AuthContext';



const Stack = createStackNavigator();

export default function App() {
  return (

<AuthProvider>
 <StripeProvider
        publishableKey="pk_test_51PisPKLxa64vt9UJpekwo1LamiXnP72nc3L2J8x2JonnIUXZFMjdgnBtg87TwouRqlntc9N2T2iPsRUr2pGNW6os00E2DZZcUi"    // 🔑 ta clé publique Stripe
        merchantIdentifier="core-techs.ca"       // requis pour Apple Pay
        urlScheme="movaride"                     // optionnel : pour deep links (utile plus tard)
      >
     
<NavigationContainer>
       
       <MainNavigator /> 
   
   </NavigationContainer>  
    </StripeProvider> 
  </AuthProvider>
  );
}