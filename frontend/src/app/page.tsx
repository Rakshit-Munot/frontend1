import HomePage from './HomePage';
import UserImportForm from './components/UserImportForm';

export default async function Home() {
  // No need to pass cookies to createClient, just call it with no arguments

  return (
    <div>
      <div className='pb-1 px-3'>
        <HomePage/>
        <UserImportForm/>
        {/* <SignUpForm/> */}
      </div>
      <div>
      </div>
      <ul>
    </ul>
    </div>
  );
}