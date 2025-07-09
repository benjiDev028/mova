import { StyleSheet,Platform } from "react-native";
export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  content: { 
    flex: 1, 
    padding: 25, 
    justifyContent: 'center' 
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    zIndex: 1,
    padding: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003DA5',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: '#003DA5',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  codeInput: {
    width: 45,
    height: 60,
    borderWidth: 2,
    borderColor: '#003DA5',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003DA5',
  },
  codeInputFilled: {
    borderColor: '#003DA5',
    backgroundColor: '#F5F5F5',
  },
  codeInputDisabled: {
    opacity: 0.6,
  },
  button: {
    backgroundColor: '#003DA5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendContainer: {
    marginTop: 25,
    alignItems: 'center',
    padding: 10,
  },
  resendText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  resendLink: {
    color: '#003DA5',
    fontWeight: '500',
  },
  resendDisabled: {
    color: '#999',
  },
});