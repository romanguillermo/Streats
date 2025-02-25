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
        headerShown: false, // Hide all tab headers by default
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={28}
              name="map"
              color={focused ? Colors.primary : 'gray'}
            />
          ),
        }}
      />
      
      {/* Adding placeholder for upcoming vendor list tab */}
      <Tabs.Screen
        name="vendors" // You'll need to create this screen file
        options={{
          title: 'Vendors',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={28}
              name="list"
              color={focused ? Colors.primary : 'gray'}
            />
          ),
        }}
      />
      
      {/* Adding placeholder for user profile tab */}
      <Tabs.Screen
        name="profile" // You'll need to create this screen file
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={28}
              name="user"
              color={focused ? Colors.primary : 'gray'}
            />
          ),
        }}
      />
    </Tabs>
  );
}