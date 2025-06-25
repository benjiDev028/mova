import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import MainNavigator from './src/navigation/MainNavigator';

import { AuthProvider } from './src/context/AuthContext';



const Stack = createStackNavigator();

export default function App() {
  return (

<AuthProvider>
<NavigationContainer>
       
       <MainNavigator /> 
   
   </NavigationContainer>  
  </AuthProvider>
  );
}