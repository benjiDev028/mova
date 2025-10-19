// screen/user/AddTrajet/styles.js
import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginLeft: 8,
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    color: '#003366',
    fontSize: 14,
  },
  routeContainer: {
    position: 'relative',
  },
  inputGroup: {
    marginBottom: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  routeDotStart: {
    backgroundColor: '#4CAF50',
  },
  routeDotStop: {
    backgroundColor: '#2196F3',
  },
  routeDotEnd: {
    backgroundColor: '#FF5722',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    marginLeft: 24,
  },
  stopInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
  },
  stopInput: {
    flex: 1,
    marginRight: 12,
  },
  placeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  removeButton: {
    padding: 4,
  },
  connectionLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginBottom: 8,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#003DA5',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addStopText: {
    marginLeft: 8,
    color: '#003DA5',
    fontWeight: '500',
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  dateTimeContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#003366',
  },
  routePreviewContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routePreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 12,
  },
  routePath: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  cityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#003366',
  },
  stopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  arrowSymbol: {
    color: '#003366',
    marginHorizontal: 4,
  },
  routeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  infoText: {
    marginLeft: 8,
    color: '#003366',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  datePickerButton: {
    color: '#003366',
    fontSize: 16,
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003DA5',
    padding: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
});
