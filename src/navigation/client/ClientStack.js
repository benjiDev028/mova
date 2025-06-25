import { createStackNavigator } from '@react-navigation/stack';
import ClientTabs from './ClientTabs'; 

// Importez les écrans SANS onglets
import DropoffLocationScreen from '../../screen/conducteur/DropOffLocation/DropOffLocation';
import PickupLocationScreen from '../../screen/conducteur/PickupLocation/PickupLocationScreen';
import ReviewAndConfirmScreen from '../../screen/conducteur/ReviewAndConfirme/ReviewAndConfirmScreen';
import PreferencesScreen from '../../screen/conducteur/Preference/PreferenceScreen';
import RouteSelectionScreen from '../../screen/conducteur/RouteSelection/RouteSelectionScreen';
import VehicleAndPriceScreen from '../../screen/conducteur/VehiculeAndPrice/VehiculeAndPriceScreen';
import ListFoundScreen from '../../screen/passager/ListFound/ListFoundScreen';
import DetailTripScreen from '../../screen/passager/DetailTrip/DetailTripScreen';
import PayBookingScreen from '../../screen/passager/PayBooking/PayBooking';
import EncaissementScreen from '../../screen/user/Encaissement/EncaissementScreen';
import StatsScreen from '../../screen/user/Stats/StatsScreen';
const Stack = createStackNavigator();

export default function ClientStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientTabs" component={ClientTabs} />

      <Stack.Screen name="PickupLocation" component={PickupLocationScreen} />
      <Stack.Screen name="DropoffLocation" component={DropoffLocationScreen} />
      <Stack.Screen name="RouteSelection" component={RouteSelectionScreen} />
      <Stack.Screen name="VehicleAndPrice" component={VehicleAndPriceScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="ReviewAndConfirm" component={ReviewAndConfirmScreen} />
      <Stack.Screen name="ListFound" component={ListFoundScreen} />
      <Stack.Screen name="DetailTrip" component={DetailTripScreen} />
      <Stack.Screen name="PayBooking" component={PayBookingScreen} />
      <Stack.Screen name="Encaissement" component={EncaissementScreen}/>
      <Stack.Screen name="Stats" component={StatsScreen} />
      
    </Stack.Navigator>
  );
}