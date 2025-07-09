//import { fetchItems, Item } from '../utils/api';
// import LoginForm from './auth/login/page';
// import SignUpForm from './auth/Register/page';
import { GoogleLogin } from '@react-oauth/google';
import DashboardPage from './dashboard/page';
import Navbar from './Navbar';
import GoogleLoginButton from './GoogleLoginB';
import LoginForm from './auth/login/page';
import SignUpForm from './auth/Register/page';
import HomePage from './HomePage';
import UserImportForm from './components/UserImportForm';

export default async function Home() {
  //const items = await fetchItems();

  return (
    <div>
      <div className='pb-1 px-3'>
        <HomePage/>
        <UserImportForm/>
        {/* <SignUpForm/> */}
      </div>
      <div>
        {/* <SignUpForm/> */}
        {/* <DashboardPage/> */}
      </div>
      {/* <h1 className="text-3xl font-bold mb-4 text-white">Items from Django Ninja Backend</h1>
      <ul className="space-y-4">
        {items.map((item: Item) => (
          <li key={item.id} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
          </li>
        ))}
      </ul>
      <SignUpForm/> */}
    </div>
  );
}