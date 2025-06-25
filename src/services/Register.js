import { Cat } from "lucide-react";

const url = 'http://192.168.2.13:8000/';




export const register =async(first_name, last_name,town, email,phone_number,date_of_birth, password,) => {

    try{
        const respponse = await fetch(url+ 'identity/register', {
            method:'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                first_name,
                last_name,
                town,
                email,
                phone_number,
                date_of_birth,
                password
            })
        });
        const data = await respponse.json();
        console.log('Réponse de register:', data);
        if (respponse.ok || respponse.status === 201) {
            return data; // Succès
        }
        else {
            throw new Error(data.detail || 'Erreur lors de l\'enregistrement');
        }   
    }
    catch (error) {
        console.error('Erreur de register :', error.message);
        throw error;
    }
}

export default { register };