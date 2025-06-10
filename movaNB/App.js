import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import MainNavigator from './src/navigation/MainNavigator';




const Stack = createStackNavigator();

export default function App() {
  return (
<NavigationContainer>
       
          <MainNavigator /> 
      
      </NavigationContainer>  
  );
}