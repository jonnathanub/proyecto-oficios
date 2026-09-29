import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "./screens/Login";
import Registro from "./screens/Registro";
import Cuenta from "./screens/Cuenta";
import Profesionales from "./screens/Profesionales";
import Solicitar from "./screens/Solicitar";
import Solicitudes from "./screens/Solicitudes";
import Resena from "./screens/Resena";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ title: "Iniciar sesion" }} />
        <Stack.Screen name="Registro" component={Registro} options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="Cuenta" component={Cuenta} options={{ title: "Mi cuenta" }} />
        <Stack.Screen name="Profesionales" component={Profesionales} options={{ title: "Profesionales" }} />
        <Stack.Screen name="Solicitar" component={Solicitar} options={{ title: "Solicitar servicio" }} />
        <Stack.Screen name="Solicitudes" component={Solicitudes} options={{ title: "Mis solicitudes" }} />
        <Stack.Screen name="Resena" component={Resena} options={{ title: "Calificar servicio" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}