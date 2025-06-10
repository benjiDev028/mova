import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";

const ProfileScreen = ({navigation}) => {
  const initials = "BM"; // Benjamin Manda

  const handlePress = (action) => {
    console.log(`Navigating to ${action}`);
   navigation.navigate(action)
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Nom */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            {/* Icône appareil photo */}
            <View style={styles.cameraIcon}>
              <Text style={styles.cameraText}>📷</Text>
            </View>
          </View>
          
          <Text style={styles.name}>Benjamin Manda</Text>
          <Text style={styles.email}>benjaminilunga011@gmail.com</Text>
          
          {/* Badge de vérification */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>● Conducteur vérifié</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem 
            icon="🚗" 
            label="Mes trajets" 
            onPress={() => handlePress("trips")} 
          />
          <MenuItem 
            icon="💰" 
            label="Mes encaissements" 
            onPress={() => handlePress("payments")} 
          />
          <MenuItem 
            icon="📊" 
            label="Statistiques" 
            onPress={() => handlePress("stats")} 
          />
          <MenuItem 
            icon="🚙" 
            label="Mon véhicule" 
            onPress={() => handlePress("vehicle")} 
          />
          <MenuItem 
            icon="⚙️" 
            label="Paramètres" 
            onPress={() => handlePress("settings")} 
          />
          <MenuItem 
            icon="💬" 
            label="Support" 
            onPress={() => handlePress("support")} 
          />
          <MenuItem 
            icon="🚪" 
            label="Déconnexion" 
            onPress={() => navigation.reset({
              index:0,
              routes:[{name:"Login"}]
            })

            }
            isLogout={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem = ({ icon, label, onPress, isLogout }) => (
  <TouchableOpacity 
    style={[styles.menuItem, isLogout && styles.logoutItem]} 
    onPress={onPress}
  >
    <View style={[styles.menuItemLeft, isLogout && styles.logoutCenter]}>
      <View style={[styles.iconContainer, isLogout && styles.logoutIconContainer]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={[styles.menuItemText, isLogout && styles.logoutText]}>
        {label}
      </Text>
    </View>
    {!isLogout && <Text style={styles.arrow}>›</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: "#2E5BFF",
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#F0F0F0",
  },
  avatarText: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#FFC72C",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cameraText: {
    fontSize: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#2D8A2D",
    fontWeight: "600",
  },
  menu: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    backgroundColor: "#FFC72C",
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  arrow: {
    fontSize: 20,
    color: "#CCCCCC",
    fontWeight: "300",
  },
  logoutItem: {

    marginTop: 20,
    justifyContent: "center",
  },
  logoutCenter: {
    justifyContent: "center",
    flex: 1,
  },
  logoutIconContainer: {
    backgroundColor: "#FF4444",
  },
  logoutText: {
    color: "#D32F2F",
    fontWeight: "600",
  },
});
export default ProfileScreen;