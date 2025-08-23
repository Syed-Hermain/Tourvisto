import { OAuthProvider, Query,ID } from "appwrite";
import { account, appwriteConfig, database } from "./client";
import { redirect } from "react-router";

export const loginWithGoogle = async () => {
  try {
    account.createOAuth2Session(OAuthProvider.Google);
  } catch (e) {
    console.error('loginWithGoogle error: '+e);
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession("current");
    return true;
  } catch (e) {
    console.error('logoutUser error: '+e);
  }
};

export const getUser = async () => {
  try {
    const user = await account.get();
    
    if(!user) return redirect('/sign-in')

    const {documents} = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [
            Query.equal('accountId', user.$id),
            Query.select(['name', 'email', 'imageUrl','joinedAt','accountId'])
        ]
    );

    if(documents.length === 0) {
      // Create a new user document if it doesn't exist
      return await storeUserData();
    }
  } catch (e) {
    console.error('getUser error: '+e);
  }
};

export const getGooglePicture = async () => {
  try {
    const user = await account.get();
    if (!user || !user.$id) return null;

    // Assuming you have the OAuth access token stored somewhere after login
    const session = await account.getSession('current');
    const accessToken = session.providerAccessToken;

    if (!accessToken) return null;

    const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=photos', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    const photoUrl = data.photos?.[0]?.url || null;
    return photoUrl;
  } catch (e) {
    console.error('getGooglePicture error: '+e);
  }
};

export const storeUserData = async () => {
  try {
    const user = await account.get();
    if (!user) return;

    // Check if user already exists
    const { documents } = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [
            Query.equal('accountId', user.$id)
        ]
    );

    if (documents.length > 0) {
        // User already exists, do not create again
        return;
    }

    const imageUrl = await getGooglePicture();

    const newUser= await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        ID.unique(),
        {
            accountId: user.$id,
            name: user.name,
            email: user.email,
            imageUrl: imageUrl || '',
            joinedAt: new Date().toISOString()
            
        },
    );

    return newUser;

  } catch (e) {
    console.error('storeUserData error: '+e);
  }
};

export const getExistingUser = async () => {
  try {
    const user = await account.get();
    if (!user) return;

    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [
        Query.equal('accountId', user.$id)
      ]
    );

    if (documents.length === 0) return null;

    return documents[0];

  } catch (e) {
    console.error('getExistingUser error: '+e);
  }
};
