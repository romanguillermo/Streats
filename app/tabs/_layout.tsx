import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function TabLayout() {
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.text, // Active text color
        tabBarInactiveTintColor: 'gray', // Inactive text color
        tabBarActiveBackgroundColor: 'white', //Active tab background color
        tabBarInactiveBackgroundColor: 'white', //Inactive tab background color
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => ( // Get focused state
            <FontAwesome
              size={28}
              name="map"
              color={focused ? Colors.primary : 'gray'}
            />
          ),
        }}
      />
    </Tabs>
  );
}