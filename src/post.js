import {formatISO9075} from 'date-fns' //used to make date look good/same as database
import { Link } from 'react-router-dom'
import Image from './Image'


export default function Post({_id,title,summary,cover,content,createdAt,author}) {
    return(
        <div className='post'>
        <div className='image'>
          <Link to={`/post/${_id}`}>
          <Image src={cover} alt=''/>
          </Link>
        </div>
        <div className='text'>
          <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
          </Link>
          <p className='info'>
            <a className='author'>{author.username}</a>
            <time>{formatISO9075(new Date(createdAt),)}</time>
          </p>
          <p className='summary'>{summary}</p>
        </div>
      </div>
    )
}