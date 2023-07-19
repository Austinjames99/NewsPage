import {formatISO9075} from 'date-fns' //used to make date look good/same as database
export default function Post({title,summary,cover,content,createdAt}) {
    return(
        <div className='post'>
        <div className='image'>
          <img src='https://cdn.geekwire.com/wp-content/uploads/2023/07/RFDiffusion_banner_2-630x354.jpeg'></img>
        </div>
        <div className='text'>
          <h2>{title}</h2>
          <p className='info'>
            <span className='author'> Austin James</span>
            <time>{formatISO9075(new Date(createdAt))}</time>
          </p>
          <p className='summary'>{summary}</p>
        </div>
      </div>
    )
}